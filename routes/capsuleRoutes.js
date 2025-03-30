// ... existing code ...
    // Delete a capsule
    router.delete('/delete/:id', async (req, res) => {
        try {
            const capsuleId = req.params.id;
            
            // Find and delete the capsule
            const deletedCapsule = await Capsule.findByIdAndDelete(capsuleId);
            
            if (!deletedCapsule) {
                return res.status(404).json({ error: 'Capsule not found' });
            }

            // If capsule had files, delete them from storage
            if (deletedCapsule.files && deletedCapsule.files.length > 0) {
                deletedCapsule.files.forEach(file => {
                    const filePath = path.join(__dirname, '..', 'uploads', file.filename);
                    fs.unlink(filePath, (err) => {
                        if (err) console.error('Error deleting file:', err);
                    });
                });
            }

            res.json({ message: 'Capsule deleted successfully', capsule: deletedCapsule });
        } catch (error) {
            console.error('Error deleting capsule:', error);
            res.status(500).json({ error: 'Failed to delete capsule' });
        }
    });
// ... existing code ... 