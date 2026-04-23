const Team = require('../models/Team');
const User = require('../models/User');
const AccessLog = require('../models/ActivityLog');

const createTeam = async (req, res) => {
  try {
    const { name } = req.body;
    const userId = req.user._id;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Team name is required'
      });
    }

    const team = await Team.create({
      name,
      createdBy: userId,
      members: [{
        user: userId,
        role: 'admin',
        joinedAt: new Date()
      }]
    });

    // Log activity
    await AccessLog.create({
      userId,
      teamId: team._id,
      action: 'created',
      metadata: { teamName: name }
    });

    res.status(201).json({
      success: true,
      message: 'Team created successfully',
      data: team
    });
  } catch (error) {
    console.error('Create team error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during team creation'
    });
  }
};

const getTeams = async (req, res) => {
  try {
    const userId = req.user._id;
    const teams = await Team.find({ 'members.user': userId })
      .populate('members.user', 'name email')
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: teams
    });
  } catch (error) {
    console.error('Get teams error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching teams'
    });
  }
};

const getTeamById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const team = await Team.findById(id)
      .populate('members.user', 'name email')
      .populate('createdBy', 'name email');

    if (!team) {
      return res.status(404).json({
        success: false,
        message: 'Team not found'
      });
    }

    // Check if user is a member
    if (!team.isMember(userId)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: Not a team member'
      });
    }

    res.status(200).json({
      success: true,
      data: team
    });
  } catch (error) {
    console.error('Get team error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching team'
    });
  }
};

const inviteMember = async (req, res) => {
  try {
    const { id } = req.params;
    const { email } = req.body;
    const userId = req.user._id;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }

    const team = await Team.findById(id);

    if (!team) {
      return res.status(404).json({
        success: false,
        message: 'Team not found'
      });
    }

    // Check if user is admin
    if (!team.isAdmin(userId)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: Only admins can invite members'
      });
    }

    // Find user by email
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found with this email'
      });
    }

    // Check if user is already a member
    if (team.isMember(user._id)) {
      return res.status(400).json({
        success: false,
        message: 'User is already a team member'
      });
    }

    // Add user to team
    team.members.push({
      user: user._id,
      role: 'member',
      joinedAt: new Date()
    });

    await team.save();

    // Log activity
    await AccessLog.create({
      userId,
      teamId: team._id,
      action: 'created',
      metadata: { 
        action: 'member_invited',
        invitedUser: email
      }
    });

    res.status(200).json({
      success: true,
      message: 'Member invited successfully',
      data: team
    });
  } catch (error) {
    console.error('Invite member error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during member invitation'
    });
  }
};

const removeMember = async (req, res) => {
  try {
    const { id, memberId } = req.params;
    const userId = req.user._id;

    const team = await Team.findById(id);

    if (!team) {
      return res.status(404).json({
        success: false,
        message: 'Team not found'
      });
    }

    // Check if user is admin
    if (!team.isAdmin(userId)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: Only admins can remove members'
      });
    }

    // Cannot remove the creator
    if (team.createdBy.toString() === memberId) {
      return res.status(400).json({
        success: false,
        message: 'Cannot remove the team creator'
      });
    }

    // Remove member
    team.members = team.members.filter(
      m => m.user.toString() !== memberId
    );

    await team.save();

    // Log activity
    await AccessLog.create({
      userId,
      teamId: team._id,
      action: 'created',
      metadata: { 
        action: 'member_removed',
        removedMemberId: memberId
      }
    });

    res.status(200).json({
      success: true,
      message: 'Member removed successfully',
      data: team
    });
  } catch (error) {
    console.error('Remove member error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during member removal'
    });
  }
};

const updateMemberRole = async (req, res) => {
  try {
    const { id, memberId } = req.params;
    const { role } = req.body;
    const userId = req.user._id;

    if (!['admin', 'member'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role. Must be admin or member'
      });
    }

    const team = await Team.findById(id);

    if (!team) {
      return res.status(404).json({
        success: false,
        message: 'Team not found'
      });
    }

    // Check if user is admin
    if (!team.isAdmin(userId)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: Only admins can update roles'
      });
    }

    // Cannot change creator's role
    if (team.createdBy.toString() === memberId) {
      return res.status(400).json({
        success: false,
        message: 'Cannot change the team creator\'s role'
      });
    }

    // Update member role
    const member = team.members.find(
      m => m.user.toString() === memberId
    );

    if (!member) {
      return res.status(404).json({
        success: false,
        message: 'Member not found'
      });
    }

    member.role = role;
    await team.save();

    // Log activity
    await AccessLog.create({
      userId,
      teamId: team._id,
      action: 'created',
      metadata: { 
        action: 'role_updated',
        memberId,
        newRole: role
      }
    });

    res.status(200).json({
      success: true,
      message: 'Member role updated successfully',
      data: team
    });
  } catch (error) {
    console.error('Update member role error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during role update'
    });
  }
};

module.exports = {
  createTeam,
  getTeams,
  getTeamById,
  inviteMember,
  removeMember,
  updateMemberRole
};
