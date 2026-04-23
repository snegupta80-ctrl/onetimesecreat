const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/auth.middleware');
const {
  createTeam,
  getTeams,
  getTeamById,
  inviteMember,
  removeMember,
  updateMemberRole
} = require('../controllers/team.controller');

// All team routes require authentication
router.use(authMiddleware);

router.post('/create', createTeam);
router.get('/', getTeams);
router.get('/:id', getTeamById);
router.post('/:id/invite', inviteMember);
router.delete('/:id/members/:memberId', removeMember);
router.put('/:id/members/:memberId/role', updateMemberRole);

module.exports = router;
