const mongoose = require('mongoose');
const express = require('express');
const router = express.Router();
const Project = require('../models/Project');
const User = require('../models/User');
const isAuth = require('../middleware/auth');

// Voditelj - aktivni projekti
router.get('/manager', isAuth, async (req, res) => {
    const projects = await Project.find({ voditelj: req.session.user._id, arhiviran: false });
    res.render('projects/index', { projects, title: "Projekti koje vodim" });
});

// Član - aktivni projekti
router.get('/member', isAuth, async (req, res) => {
    const projects = await Project.find({ clanovi_tima: req.session.user._id, arhiviran: false });
    res.render('projects/index', { projects, title: "Projekti na kojima sudjelujem" });
});

// Arhiva (prikazuje sve gdje je korisnik voditelj ili član, a projekt je arhiviran)
router.get('/archive', isAuth, async (req, res) => {
    const projects = await Project.find({ 
        $or: [{ voditelj: req.session.user._id }, { clanovi_tima: req.session.user._id }], 
        arhiviran: true 
    });
    res.render('projects/index', { projects, title: "Arhiva projekata" });
});

// Svi aktivni projekti (default index)
router.get('/', isAuth, async (req, res) => {
    const projects = await Project.find({ 
        $or: [{ voditelj: req.session.user._id }, { clanovi_tima: req.session.user._id }], 
        arhiviran: false 
    });
    res.render('projects/index', { projects, title: "Svi moji projekti" });
});

// Forma za novi projekt
router.get('/new', isAuth, (req, res) => {
    res.render('projects/new');
});

// CREATE - dodavanje projekta
router.post('/', isAuth, async (req, res) => {
    try {
        // Provjera postoji li korisnik u sesiji
        if (!req.session.user || !req.session.user._id) {
            console.log("Sesija nije pronađena!", req.session);
            return res.status(401).send("Niste prijavljeni. Molimo prijavite se ponovno.");
        }

        const project = new Project({
            naziv: req.body.naziv,
            opis: req.body.opis,
            cijena: req.body.cijena,
            obavljeniPoslovi: req.body.obavljeniPoslovi || "",
            datumPocetka: req.body.datumPocetka,
            datumZavrsetka: req.body.datumZavrsetka,
            // Koristimo new mongoose.Types.ObjectId da budemo 100% sigurni
            voditelj: new mongoose.Types.ObjectId(req.session.user._id) 
        });

        await project.save();
        res.redirect('/projects/manager');
    } catch (err) {
        console.error("Spremanje neuspješno:", err);
        res.status(400).send("Greška pri spremanju: " + err.message);
    }
});

// DETALJI PROJEKTA
router.get('/:id', isAuth, async (req, res) => {
    try {
        const project = await Project.findById(req.params.id).populate('voditelj').populate('clanovi_tima');
        const sviKorisnici = await User.find({ _id: { $ne: req.session.user._id } });
        res.render('projects/show', { project, sviKorisnici });
    } catch (err) {
        res.status(500).send(err.message);
    }
});

// DODAJ ČLANA (u routes/projects.js)
router.post('/:id/team', isAuth, async (req, res) => {
    try {
        const project = await Project.findById(req.params.id);
        
        // Sigurnosna provjera: Samo voditelj dodaje
        if (project.voditelj.toString() !== req.session.user._id) {
            return res.status(403).send("Samo voditelj može dodavati članove.");
        }

        const noviClanId = req.body.korisnikId;

        // PROVJERA: Da li je korisnik već član?
        if (project.clanovi_tima.includes(noviClanId)) {
            // Možeš redirectati nazad uz poruku ili samo ignorirati
            return res.redirect(`/projects/${req.params.id}`);
        }

        project.clanovi_tima.push(noviClanId);
        await project.save();
        res.redirect(`/projects/${req.params.id}`);
    } catch (err) {
        res.status(400).send(err.message);
    }
});

// AŽURIRAJ POSLOVE (voditelj ili član)
router.put('/:id/poslovi', isAuth, async (req, res) => {
    const project = await Project.findById(req.params.id);
    const isMember = project.clanovi_tima.includes(req.session.user._id);
    const isManager = project.voditelj.toString() === req.session.user._id;

    if (!isMember && !isManager) return res.status(403).send("Nemate ovlasti");
    
    project.obavljeniPoslovi = req.body.obavljeniPoslovi;
    await project.save();
    res.redirect(`/projects/${req.params.id}`);
});

// ARHIVIRAJ (samo voditelj)
router.put('/:id/archive', isAuth, async (req, res) => {
    const project = await Project.findById(req.params.id);
    if (project.voditelj.toString() !== req.session.user._id) return res.status(403).send("Nemate ovlasti");
    
    project.arhiviran = !project.arhiviran;
    await project.save();
    res.redirect('/projects/archive');
});

// DELETE
router.delete('/:id', isAuth, async (req, res) => {
    const project = await Project.findById(req.params.id);
    if (project.voditelj.toString() !== req.session.user._id) return res.status(403).send("Nemate ovlasti");
    
    await Project.findByIdAndDelete(req.params.id);
    res.redirect('/projects/manager');
});

// FORMA ZA UREĐIVANJE (GET)
router.get('/:id/edit', isAuth, async (req, res) => {
    try {
        const project = await Project.findById(req.params.id);
        if (!project) return res.status(404).send("Projekt nije pronađen");

        // Provjera ovlasti: Samo voditelj može pristupiti formi za uređivanje
        if (project.voditelj.toString() !== req.session.user._id) {
            return res.status(403).send("Nemate ovlasti za uređivanje ovog projekta.");
        }

        res.render('projects/edit', { project });
    } catch (err) {
        res.status(500).send(err.message);
    }
});

// PUNI UPDATE PROJEKTA (PUT)
router.put('/:id', isAuth, async (req, res) => {
    try {
        const project = await Project.findById(req.params.id);
        if (!project) return res.status(404).send("Projekt nije pronađen");

        // Provjera ovlasti
        if (project.voditelj.toString() !== req.session.user._id) {
            return res.status(403).send("Nemate ovlasti.");
        }

        // Ažuriranje svih osnovnih polja
        project.naziv = req.body.naziv;
        project.opis = req.body.opis;
        project.cijena = req.body.cijena;
        project.datumPocetka = req.body.datumPocetka;
        project.datumZavrsetka = req.body.datumZavrsetka;
        project.obavljeniPoslovi = req.body.obavljeniPoslovi;

        await project.save();
        res.redirect(`/projects/${req.params.id}`);
    } catch (err) {
        res.status(400).send("Greška pri ažuriranju: " + err.message);
    }
});

module.exports = router;