const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));


const API_URL = 'https://smartbrainske.com/api/v1';
const API_TOKEN = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJhdWQiOiIxIiwianRpIjoiZjIwNWQ2NmFlMDE5MDgxYmMzYTNkZGI1Yzg2MGUxM2JiYmE1MmQ5NWQ1MmRlMTczOTMyMWU4MjA2MTJhMGQ5M2FiMzhlNzVkODc4ZWJmNzEiLCJpYXQiOjE3MTg4OTExMDQuNTY1NzMzLCJuYmYiOjE3MTg4OTExMDQuNTY1NzM2LCJleHAiOjIxOTIxOTAzMDQuNTYxMjM5LCJzdWIiOiIxIiwic2NvcGVzIjpbXX0.Vg-Xn57w4MCgT3oYaiJ8-9uFDXrog5pcSi4xne-tF1N9QDDtInC23AVqIAXo5RfSHXMwsM9JcEPOEhRkvt4BvYHHFVf7cOd7RcOO2-fjC7o0zXaqgGWU3xcxwx8GzL6LvYit86FZ0DbX03D4re3hRH2xVwVTs7F4qWIY5XWa4ufPoFn-3T99i9NKqsbbRyO5gDoACQ68_otPpJGJyCpggpHEf-XxuY5T_QFF0b6tw96GLW93t6lZfWyD84y5mG_nRcgbs7ibMum9nUEkkLP5gr4tp_CtaAmVnpMbTbVAAR8BukEYFWL1cOeXABUFv8oGoaO8LFElQ24xdub6tt6rFWyIwj02QKeDUFYNLEhO9yasKcOEaPbA1SXgK7ci6fZk2Rr7E4twDFcnubXuTV3DZ08C_qFxCQUwoSdo11RY50-YcmHQ-rlHyxokSu-972RruIKQ8IjOITwVOqDK5M_7k6VK3Ha26JuEGhmW8dWA1EgBHNHvoZP52XtXY3Gs5ICPAJAQZr6j21CndClqJ2EMVa4QY7AIQJDp1mpDTRiRvseVjqgyehltSaC4504AHPuQ21d--cp3YGHvuZkoEUOKgf_mbo0PMjqvvNJ_d2X1uqP7kduJ7fFxMWy4pwzjIPvFQnVZZ1UX14PSJLntFK57HUUSin1wMGq-Qjd4OmjLDsU';

const getHeaders = () => ({
    'Authorization': `Bearer ${API_TOKEN}`,
    'Accept': 'application/json'
});

const isAssetCheckedOut = async (asset_id) => {
    try {
        const response = await axios.get(`${API_URL}/hardware/${asset_id}`, { headers: getHeaders() });
        const asset = response.data;
        return asset.status_label.name.toLowerCase() !== 'available';
    } catch (error) {
        console.error('Error fetching asset status:', error);
        return false;
    }
};

app.get('/users', async (req, res) => {
    try {
        const response = await axios.get(`${API_URL}/users`, { headers: getHeaders() });
        res.json(response.data);
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ error: error.message });
    }
});

app.get('/locations', async (req, res) => {
    try {
        const response = await axios.get(`${API_URL}/locations`, { headers: getHeaders() });
        res.json(response.data);
    } catch (error) {
        console.error('Error fetching locations:', error);
        res.status(500).json({ error: error.message });
    }
});

app.get('/users/:userId/assets', async (req, res) => {
    const userId = req.params.userId;
    try {
        const response = await axios.get(`${API_URL}/hardware`, {
            headers: getHeaders(),
            params: {
                assigned_to: userId,
                limit: 1000
            }
        });
        const userAssets = response.data.rows.filter(asset => {
            return asset.assigned_to && asset.assigned_to.id === parseInt(userId);
        });
        res.json({ total: userAssets.length, rows: userAssets });
    } catch (error) {
        console.error('Error fetching assets for user:', error);
        res.status(500).json({ error: 'Error fetching checked-out assets count' });
    }
});

app.post('/checkout', async (req, res) => {
    const { asset_id, user_id, checkout_at, expected_checkin } = req.body;
    try {
        const payload = {
            checkout_to_type: 'user',
            assigned_user: user_id,
            checkout_at,
            expected_checkin
        };
        const response = await axios.post(`${API_URL}/hardware/${asset_id}/checkout`, payload, { headers: getHeaders() });
        res.json(response.data);
    } catch (error) {
        console.error('Error during checkout:', error.response ? error.response.data : error.message);
        res.status(500).json({ error: error.response ? error.response.data : error.message });
    }
});

app.post('/checkin', async (req, res) => {
    const { asset_id, user_id, checkin_at } = req.body;
    try {
        const payload = {
            checkin_from_type: 'user',
            assigned_user: user_id,
            checkin_at
        };
        const response = await axios.post(`${API_URL}/hardware/${asset_id}/checkin`, payload, { headers: getHeaders() });
        res.json(response.data);
    } catch (error) {
        console.error('Error during checkin:', error.response ? error.response.data : error.message);
        res.status(500).json({ error: error.response ? error.response.data : error.message });
    }
});

app.get('/checkin', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'checkin.html'));
});

app.listen(PORT, () => {
    console.log(`Server running on https://localhost:${PORT}`);
});