// Service request workflow: Submitted -> Assigned -> In Progress -> Resolved -> Closed
const STATUSES = ['Submitted', 'Assigned', 'In Progress', 'Resolved', 'Closed'];
const UNRESOLVED = ['Submitted', 'Assigned', 'In Progress'];

// Only one step forward is allowed (no skipping, no going back)
function canTransition(from, to) {
  const i = STATUSES.indexOf(from);
  const j = STATUSES.indexOf(to);
  return i !== -1 && j === i + 1;
}

const nextStatus = from => STATUSES[STATUSES.indexOf(from) + 1] || null;

module.exports = { STATUSES, UNRESOLVED, canTransition, nextStatus };
