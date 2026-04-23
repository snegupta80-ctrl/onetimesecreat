const Secret = require('../models/Secret');
const AccessLog = require('../models/ActivityLog');
const Team = require('../models/Team');
const bcrypt = require('bcryptjs');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

const getLocationFromIP = async (ip) => {
  try {
    const response = await axios.get(`https://ipapi.co/${ip}/json/`);
    return {
      ip: ip,
      city: response.data.city || 'Unknown',
      country: response.data.country_name || 'Unknown'
    };
  } catch (error) {
    console.error('IP location error:', error);
    return { ip, city: 'Unknown', country: 'Unknown' };
  }
};

const createSecret = async (req, res) => {
  try {
    const { encryptedData, expiresAt, password, type, accessLimit, tags, isAnonymous, teamId } = req.body;
    const file = req.file;

    if (!encryptedData && !file) {
      return res.status(400).json({
        success: false,
        message: 'Encrypted data or file is required'
      });
    }

    if (!expiresAt) {
      return res.status(400).json({
        success: false,
        message: 'Expiration time is required'
      });
    }

    const expirationDate = new Date(expiresAt);
    if (expirationDate <= new Date()) {
      return res.status(400).json({
        success: false,
        message: 'Expiration time must be in the future'
      });
    }

    let hashedPassword = null;
    if (password) {
      const salt = await bcrypt.genSalt(10);
      hashedPassword = await bcrypt.hash(password, salt);
    }

    const secretData = {
      encryptedData,
      expiresAt: expirationDate,
      type: type || 'text',
      accessLimit: accessLimit || 1,
      tags: tags || [],
      isAnonymous: isAnonymous || false,
      password: hashedPassword
    };

    if (file) {
      secretData.fileData = {
        filename: file.filename,
        originalName: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
        path: file.path
      };
      secretData.type = 'file';
    }

    if (!isAnonymous && req.user) {
      secretData.createdBy = req.user._id;
    }

    // Add teamId if provided
    if (teamId) {
      secretData.teamId = teamId;
    }

    const secret = await Secret.create(secretData);

    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const shareableLink = `${baseUrl}/view/${secret._id}`;
    
    console.log('QR Share URL:', shareableLink);

    // Log activity
    await AccessLog.create({
      userId: req.user ? req.user._id : null,
      secretId: secret._id,
      teamId: secret.teamId,
      action: 'created',
      ip: req.ip
    });
    
    res.status(201).json({
      success: true,
      message: 'Secret created successfully',
      data: {
        id: secret._id,
        expiresAt: secret.expiresAt,
        type: secret.type,
        shareableLink
      }
    });
  } catch (error) {
    console.error('Create secret error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during secret creation'
    });
  }
};

const viewSecret = async (req, res) => {
  try {
    const { id } = req.params;
    const { password } = req.body;

    const secret = await Secret.findById(id);

    if (!secret) {
      return res.status(404).json({
        success: false,
        message: 'Secret not found'
      });
    }

    // Check if secret is expired
    if (new Date() > secret.expiresAt) {
      await secret.deleteOne();
      await AccessLog.create({
        userId: req.user ? req.user._id : null,
        secretId: secret._id,
        teamId: secret.teamId,
        action: 'expired'
      });
      return res.status(400).json({
        success: false,
        message: 'Secret has expired'
      });
    }

    // Check if already viewed
    if (secret.isViewed) {
      return res.status(400).json({
        success: false,
        message: 'Secret has already been viewed'
      });
    }

    // Check if access limit reached
    if (secret.viewCount >= secret.accessLimit) {
      return res.status(400).json({
        success: false,
        message: 'Access limit has been reached'
      });
    }

    // Check if secret is team-based and validate access
    if (secret.teamId && req.user) {
      const team = await Team.findById(secret.teamId);
      if (team && !team.isMember(req.user._id)) {
        return res.status(403).json({
          success: false,
          message: 'Access denied: Not a team member'
        });
      }
    }

    // Check password protection
    if (secret.password) {
      if (!password) {
        return res.status(401).json({
          success: false,
          requiresPassword: true,
          message: 'Password required'
        });
      }

      const isPasswordValid = await bcrypt.compare(password, secret.password);
      if (!isPasswordValid) {
        return res.status(401).json({
          success: false,
          message: 'Invalid password'
        });
      }
    }

    // Get location data
    const ip = req.ip || req.connection.remoteAddress;
    let locationData = {};
    try {
      locationData = await getLocationFromIP(ip);
    } catch (error) {
      console.error('Error getting location:', error);
    }

    // Increment view count
    secret.viewCount += 1;
    secret.location = locationData;

    // Mark as viewed if access limit reached
    if (secret.viewCount >= secret.accessLimit) {
      secret.isViewed = true;
    }

    await secret.save();

    // Log activity
    await AccessLog.create({
      userId: req.user ? req.user._id : null,
      secretId: secret._id,
      teamId: secret.teamId,
      action: 'viewed',
      ip: locationData.ip,
      location: locationData
    });

    // If it's a file secret, return file data
    if (secret.type === 'file' && secret.fileData) {
      return res.status(200).json({
        success: true,
        data: {
          type: 'file',
          fileData: secret.fileData,
          location: locationData
        }
      });
    }

    res.status(200).json({
      success: true,
      data: {
        encryptedData: secret.encryptedData,
        location: locationData
      }
    });
  } catch (error) {
    console.error('View secret error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during secret retrieval'
    });
  }
};

const getUserSecrets = async (req, res) => {
  try {
    const { tag } = req.query;
    const query = { createdBy: req.user._id };
    
    if (tag) {
      query.tags = tag;
    }

    const secrets = await Secret.find(query)
      .select('encryptedData isViewed expiresAt createdAt type tags viewCount accessLimit')
      .sort({ createdAt: -1 });

    const analytics = {
      total: secrets.length,
      viewed: secrets.filter(s => s.isViewed).length,
      expired: secrets.filter(s => s.isExpired()).length,
      active: secrets.filter(s => !s.isViewed && !s.isExpired()).length
    };

    res.status(200).json({
      success: true,
      data: secrets,
      analytics
    });
  } catch (error) {
    console.error('Get user secrets error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching secrets'
    });
  }
};

const cleanupExpiredSecrets = async (req, res) => {
  try {
    const result = await Secret.deleteMany({
      expiresAt: { $lt: new Date() }
    });

    res.status(200).json({
      success: true,
      message: `Deleted ${result.deletedCount} expired secrets`
    });
  } catch (error) {
    console.error('Cleanup error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during cleanup'
    });
  }
};

const downloadFile = async (req, res) => {
  try {
    const { id } = req.params;
    const secret = await Secret.findById(id);

    if (!secret || !secret.fileData || !secret.fileData.path) {
      return res.status(404).json({
        success: false,
        message: 'File not found'
      });
    }

    const filePath = path.resolve(secret.fileData.path);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        message: 'File not found on server'
      });
    }

    res.download(filePath, secret.fileData.originalName, (err) => {
      if (err) {
        console.error('Download error:', err);
        if (!res.headersSent) {
          res.status(500).json({
            success: false,
            message: 'Error downloading file'
          });
        }
      }
    });
  } catch (error) {
    console.error('Download file error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during file download'
    });
  }
};

const getAccessLogs = async (req, res) => {
  try {
    const { id } = req.params;
    const logs = await AccessLog.find({ secretId: id })
      .sort({ accessedAt: -1 });

    res.status(200).json({
      success: true,
      data: logs
    });
  } catch (error) {
    console.error('Get access logs error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching access logs'
    });
  }
};

module.exports = { createSecret, viewSecret, getUserSecrets, cleanupExpiredSecrets, downloadFile, getAccessLogs };
