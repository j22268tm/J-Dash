const express = require('express');
const cors = require('cors');
const api = require('./backend/api');

const app = express();
const router = express.Router();

app.use(cors());

app.use((req, res, next) => {
    if (req.apiGateway && req.apiGateway.event && req.apiGateway.event.body) {
        req.body = JSON.parse(req.apiGateway.event.body);
    }
    next();
});


router.post('/api/login', async (req, res) => {
    const { username, password, URIEncode } = req.body;
    const data = URIEncode ? await api.GetLoginDataURI(username, password) : await api.GetLoginData(username, password);
    res.send(data);
});

router.post('/api/schedule', async (req, res) => {
    const { username, password } = req.body;
    let { semester, term } = req.body;
    semester = semester == undefined ? 0 : semester;
    term = term == undefined ? 0 : term;
    const data = await api.GetSchedule(username, password, semester, term);
    res.send(data);
});

router.post('/api/lectureStatus', async (req, res) => {
    const { username, password, lecture } = req.body;
    const data = await api.GetLectureStatus(username, password, lecture);
    res.send(data);
});

router.post('/api/homeUrl', async (req, res) => {
    const { username, password } = req.body;
    const data = await api.GetHomeUrl(username, password);
    res.send(data);
});

router.post('/api/attendance', async (req, res) => {
    const { username, password, code } = req.body;
    const data = await api.InputAttendCode(username, password, code);
    res.send(data);
});

router.post('/api/lectureSyllabus', async (req, res) => {
    const { username, password, lecture } = req.body;
    const data = await api.GetLectureSyllabusUrl(username, password, lecture);
    res.send(data);
});

router.post('/api/notification/url', async (req, res) => {
    const { username, password } = req.body;
    const data = await api.GetNotificationUrl(username, password);
    res.send(data);
});

router.post('/api/notification/unreadCount', async (req, res) => {
    const { username, password } = req.body;
    const data = await api.GetUnreadNotificationCount(username, password);
    res.send(data);
});


app.use('/default/j-dash-function', router);

module.exports = app;