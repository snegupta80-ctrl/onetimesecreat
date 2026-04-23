const AccessLog = require('../models/ActivityLog');
const Secret = require('../models/Secret');
const Team = require('../models/Team');

const getActivityLogs = async (req, res) => {
  try {
    const userId = req.user._id;
    const { limit = 20, teamId } = req.query;

    // Get teams user is a member of
    const userTeams = await Team.find({ 'members.user': userId }).select('_id');
    const teamIds = userTeams.map(t => t._id);

    // Build query
    const query = {
      $or: [
        { userId },
        { teamId: { $in: teamIds } }
      ]
    };

    // Filter by specific team if provided
    if (teamId) {
      query.teamId = teamId;
    }

    const logs = await AccessLog.find(query)
      .populate('userId', 'name email')
      .populate('secretId', 'type expiresAt')
      .populate('teamId', 'name')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));

    res.status(200).json({
      success: true,
      data: logs
    });
  } catch (error) {
    console.error('Get activity logs error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching activity logs'
    });
  }
};

const getAnalytics = async (req, res) => {
  try {
    const userId = req.user._id;
    const { teamId } = req.query;

    // Get teams user is a member of
    const userTeams = await Team.find({ 'members.user': userId }).select('_id');
    const teamIds = userTeams.map(t => t._id);

    // Build query
    const query = {
      $or: [
        { userId },
        { teamId: { $in: teamIds } }
      ]
    };

    // Filter by specific team if provided
    if (teamId) {
      query.teamId = teamId;
    }

    const totalSecrets = await Secret.countDocuments({
      $or: [
        { createdBy: userId },
        { teamId: { $in: teamIds } }
      ]
    });

    const activeSecrets = await Secret.countDocuments({
      $or: [
        { createdBy: userId },
        { teamId: { $in: teamIds } }
      ],
      isViewed: false,
      expiresAt: { $gt: new Date() }
    });

    const viewedSecrets = await Secret.countDocuments({
      $or: [
        { createdBy: userId },
        { teamId: { $in: teamIds } }
      ],
      isViewed: true
    });

    const expiredSecrets = await Secret.countDocuments({
      $or: [
        { createdBy: userId },
        { teamId: { $in: teamIds } }
      ],
      expiresAt: { $lt: new Date() }
    });

    const recentActivity = await AccessLog.countDocuments(query);

    res.status(200).json({
      success: true,
      data: {
        totalSecrets,
        activeSecrets,
        viewedSecrets,
        expiredSecrets,
        recentActivity
      }
    });
  } catch (error) {
    console.error('Get analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching analytics'
    });
  }
};

module.exports = {
  getActivityLogs,
  getAnalytics
};
