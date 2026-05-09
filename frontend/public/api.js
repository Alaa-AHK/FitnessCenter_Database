const API_BASE = 'http://localhost:5000/api';   

async function getAllMembers() {
  const response = await fetch(`${API_BASE}/members`);
  if (!response.ok) throw new Error('Failed to load members');
  return response.json();
}

async function addMember(memberData) {
  const response = await fetch(`${API_BASE}/members`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(memberData)
  });
  if (!response.ok) throw new Error('Add member failed');
  return response.json();
}

async function updateMember(id, memberData) {
  const response = await fetch(`${API_BASE}/members/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(memberData)
  });
  if (!response.ok) throw new Error('Update member failed');
  return response.json();
}

async function deleteMember(id) {
  const response = await fetch(`${API_BASE}/members/${id}`, {
    method: 'DELETE'
  });
  if (!response.ok) throw new Error('Delete member failed');
}

async function getAllCoaches() {
  const response = await fetch(`${API_BASE}/coaches`);
  if (!response.ok) throw new Error('Failed to load coaches');
  return response.json();
}

async function addCoach(coachData) {
  const response = await fetch(`${API_BASE}/coaches`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(coachData)
  });
  if (!response.ok) throw new Error('Add coach failed');
  return response.json();
}

async function updateCoach(id, coachData) {
  const response = await fetch(`${API_BASE}/coaches/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(coachData)
  });
  if (!response.ok) throw new Error('Update coach failed');
  return response.json();
}

async function deleteCoach(id) {
  const response = await fetch(`${API_BASE}/coaches/${id}`, {
    method: 'DELETE'
  });
  if (!response.ok) throw new Error('Delete coach failed');
}

async function getAllClasses() {
  const response = await fetch(`${API_BASE}/classes`);
  if (!response.ok) throw new Error('Failed to load classes');
  return response.json();
}

async function addClass(classData) {
  const response = await fetch(`${API_BASE}/classes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(classData)
  });
  if (!response.ok) throw new Error('Add class failed');
  return response.json();
}

async function updateClass(id, classData) {
  const response = await fetch(`${API_BASE}/classes/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(classData)
  });
  if (!response.ok) throw new Error('Update class failed');
  return response.json();
}

async function deleteClass(id) {
  const response = await fetch(`${API_BASE}/classes/${id}`, {
    method: 'DELETE'
  });
  if (!response.ok) throw new Error('Delete class failed');
}

async function getAllEnrollments() {
  const response = await fetch(`${API_BASE}/enrollments`);
  if (!response.ok) throw new Error('Failed to load enrollments');
  return response.json();
}

async function addEnrollment(enrollmentData) {
  const response = await fetch(`${API_BASE}/enrollments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(enrollmentData)
  });
  if (!response.ok) throw new Error('Add enrollment failed');
  return response.json();
}

async function updateEnrollment(id, enrollmentData) {
  const response = await fetch(`${API_BASE}/enrollments/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(enrollmentData)
  });
  if (!response.ok) throw new Error('Update enrollment failed');
  return response.json();
}

async function deleteEnrollment(id) {
  const response = await fetch(`${API_BASE}/enrollments/${id}`, {
    method: 'DELETE'
  });
  if (!response.ok) throw new Error('Delete enrollment failed');
}

async function getAllEquipment() {
  const response = await fetch(`${API_BASE}/equipment`);
  if (!response.ok) throw new Error('Failed to load equipment');
  return response.json();
}

async function addEquipment(equipmentData) {
  const response = await fetch(`${API_BASE}/equipment`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(equipmentData)
  });
  if (!response.ok) throw new Error('Add equipment failed');
  return response.json();
}

async function updateEquipment(id, equipmentData) {
  const response = await fetch(`${API_BASE}/equipment/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(equipmentData)
  });
  if (!response.ok) throw new Error('Update equipment failed');
  return response.json();
}

async function deleteEquipment(id) {
  const response = await fetch(`${API_BASE}/equipment/${id}`, {
    method: 'DELETE'
  });
  if (!response.ok) throw new Error('Delete equipment failed');
}

async function getAllPlans() {
  const response = await fetch(`${API_BASE}/plans`);
  if (!response.ok) throw new Error('Failed to load plans');
  return response.json();
}

async function addPlan(planData) {
  const response = await fetch(`${API_BASE}/plans`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(planData)
  });
  if (!response.ok) throw new Error('Add plan failed');
  return response.json();
}

async function updatePlan(id, planData) {
  const response = await fetch(`${API_BASE}/plans/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(planData)
  });
  if (!response.ok) throw new Error('Update plan failed');
  return response.json();
}

async function deletePlan(id) {
  const response = await fetch(`${API_BASE}/plans/${id}`, {
    method: 'DELETE'
  });
  if (!response.ok) throw new Error('Delete plan failed');
}

async function getAllBranches() {
    const res = await fetch(`${API_BASE}/branches`);
    if (!res.ok) throw new Error('Failed to load branches');
    return res.json();
}

async function getCoachList() {
    const res = await fetch(`${API_BASE}/lookup/coaches`);
    if (!res.ok) throw new Error('Failed to load coach list');
    return res.json();
}

async function getPlanList() {
    const res = await fetch(`${API_BASE}/lookup/plans`);
    if (!res.ok) throw new Error('Failed to load plan list');
    return res.json();
}

async function getClassList() {
    const res = await fetch(`${API_BASE}/lookup/classes`);
    if (!res.ok) throw new Error('Failed to load class list');
    return res.json();
}

async function getMemberProfile(id) {
    const res = await fetch(`${API_BASE}/members/${id}`);
    if (!res.ok) throw new Error('Failed to load member profile');
    return res.json();
}

async function getEquipmentList() {
    const res = await fetch(`${API_BASE}/lookup/equipment`);
    if (!res.ok) throw new Error('Failed to load equipment list');
    return res.json();
}

async function getMemberList() {
    const res = await fetch(`${API_BASE}/lookup/members`);
    if (!res.ok) throw new Error('Failed to load member list');
    return res.json();
}

async function updateBranchHours(id, hours) {
    const res = await fetch(`${API_BASE}/branches/${id}/hours`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ hours })
    });
    if (!res.ok) throw new Error('Failed to update branch hours');
    return res.json();
}

async function updateBranchManager(id, data) {
    const res = await fetch(`${API_BASE}/branches/${id}/manager`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Failed to update branch manager');
    return res.json();
}