const express = require('express');
const { pb } = require('./pocketbase.js');
const router = express.Router();

// Get all records from a collection
router.get('/db/:projectId/:collection', async (req, res) => {
  const { projectId, collection } = req.params;
  const fullName = `${projectId}_${collection}`;

  try {
    const records = await pb.collection(fullName).getFullList({
      sort: '-created'
    });
    console.log(`📖 GET ${fullName}: ${records.length} records`);
    res.json(records);
  } catch (error) {
    console.error(`❌ GET ${fullName} failed:`, error.message);
    res.status(500).json({ error: error.message });
  }
});

// Create a new record
router.post('/db/:projectId/:collection', async (req, res) => {
  const { projectId, collection } = req.params;
  const fullName = `${projectId}_${collection}`;

  try {
    const record = await pb.collection(fullName).create(req.body);
    console.log(`✅ CREATE ${fullName}:`, record.id);
    res.json(record);
  } catch (error) {
    console.error(`❌ CREATE ${fullName} failed:`, error.message);
    res.status(500).json({ error: error.message });
  }
});

// Update a record
router.patch('/db/:projectId/:collection/:id', async (req, res) => {
  const { projectId, collection, id } = req.params;
  const fullName = `${projectId}_${collection}`;

  try {
    const record = await pb.collection(fullName).update(id, req.body);
    console.log(`✅ UPDATE ${fullName}/${id}`);
    res.json(record);
  } catch (error) {
    console.error(`❌ UPDATE ${fullName}/${id} failed:`, error.message);
    res.status(500).json({ error: error.message });
  }
});

// Delete a record
router.delete('/db/:projectId/:collection/:id', async (req, res) => {
  const { projectId, collection, id } = req.params;
  const fullName = `${projectId}_${collection}`;

  try {
    await pb.collection(fullName).delete(id);
    console.log(`✅ DELETE ${fullName}/${id}`);
    res.json({ success: true });
  } catch (error) {
    console.error(`❌ DELETE ${fullName}/${id} failed:`, error.message);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
