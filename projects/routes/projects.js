const express = require('express');
const router = express.Router();
const Project = require('../models/Project');
const isAuth = require('../middleware/auth');

// =====================================================
// FRONTEND RUTE (EJS PRIKAZI)
// =====================================================

// Lista svih projekata
router.get('/', isAuth, async (req, res) => {
    try {
        const projects = await Project.find();
        res.render('projects/index', { projects });
    } catch (err) {
        res.status(500).send(err.message);
    }
});

// Forma za novi projekt
router.get('/new', isAuth, (req, res) => {
    res.render('projects/new');
});

// Detalji projekta + članovi tima
router.get('/:id', isAuth, async (req, res) => {
    try {
        const project = await Project.findById(req.params.id);
        if (!project) return res.status(404).send("Projekt nije pronađen");
        res.render('projects/show', { project });
    } catch (err) {
        res.status(500).send(err.message);
    }
});

// Forma za uređivanje projekta
router.get('/:id/edit', isAuth, async (req, res) => {
    try {
        const project = await Project.findById(req.params.id);
        if (!project) return res.status(404).send("Projekt nije pronađen");
        res.render('projects/edit', { project });
    } catch (err) {
        res.status(500).send(err.message);
    }
});

// =====================================================
// API / ACTION RUTE
// =====================================================

// CREATE - dodavanje projekta
router.post('/', isAuth, async (req, res) => {
    try {
        const project = new Project(req.body);
        await project.save();
        res.redirect('/projects');
    } catch (err) {
        res.status(400).send(err.message);
    }
});

// UPDATE - ažuriranje projekta
router.put('/:id', isAuth, async (req, res) => {
    try {
        await Project.findByIdAndUpdate(req.params.id, req.body);
        res.redirect(`/projects/${req.params.id}`);
    } catch (err) {
        res.status(400).send(err.message);
    }
});

// DELETE - uklanjanje projekta
router.delete('/:id', isAuth, async (req, res) => {
    try {
        await Project.findByIdAndDelete(req.params.id);
        res.redirect('/projects');
    } catch (err) {
        res.status(400).send(err.message);
    }
});

// =====================================================
// ČLANOVI TIMA – CRUD
// =====================================================

// DODAJ ČLANA TIMA
router.post('/:id/team', isAuth, async (req, res) => {
    try {
        const project = await Project.findById(req.params.id);
        if (!project) return res.status(404).send("Projekt nije pronađen");

        project.teamMembers.push(req.body);
        await project.save();

        res.redirect(`/projects/${req.params.id}`);
    } catch (err) {
        res.status(400).send(err.message);
    }
});

// UREDI ČLANA TIMA
router.put('/:id/team/:memberId', isAuth, async (req, res) => {
    try {
        const project = await Project.findById(req.params.id);
        if (!project) return res.status(404).send("Projekt nije pronađen");

        const member = project.teamMembers.id(req.params.memberId);
        if (!member) return res.status(404).send("Član tima nije pronađen");

        Object.assign(member, req.body);
        await project.save();

        res.redirect(`/projects/${req.params.id}`);
    } catch (err) {
        res.status(400).send(err.message);
    }
});

// OBRIŠI ČLANA TIMA
router.delete('/:id/team/:memberId', isAuth, async (req, res) => {
    try {
        const project = await Project.findById(req.params.id);
        if (!project) return res.status(404).send("Projekt nije pronađen");

        project.teamMembers = project.teamMembers.filter(
            member => member._id.toString() !== req.params.memberId
        );

        await project.save();
        res.redirect(`/projects/${req.params.id}`);
    } catch (err) {
        res.status(400).send(err.message);
    }
});

module.exports = router;
