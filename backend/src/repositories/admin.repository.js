import Admin from '../models/admin.model.js';

export function findByUsername(username) {
  return Admin.findOne({ username });
}

export function countAdmins() {
  return Admin.countDocuments();
}

export function createAdmin(data) {
  const admin = new Admin(data);
  return admin.save();
}

export function findOneAdmin(filter = {}, select) {
  let q = Admin.findOne(filter);
  if (select) q = q.select(select);
  return q;
}

export function findById(id) {
  return Admin.findById(id);
}

export function findByClerkId(clerkId) {
  return Admin.findOne({ clerkId });
}

export function updateAdmin(id, data) {
  return Admin.findByIdAndUpdate(id, data, { new: true });
}

export function updateByClerkId(clerkId, data) {
  return Admin.findOneAndUpdate({ clerkId }, data, { new: true });
}
