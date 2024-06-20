const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');

const app = express();
const PORT = 3000;

const API_URL = 'https://smartbrainske.com/api/v1';
const API_TOKEN = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJhdWQiOiIxIiwianRpIjoiZjIwNWQ2NmFlMDE5MDgxYmMzYTNkZGI1Yzg2MGUxM2JiYmE1MmQ5NWQ1MmRlMTczOTMyMWU4MjA2MTJhMGQ5M2FiMzhlNzVkODc4ZWJmNzEiLCJpYXQiOjE3MTg4OTExMDQuNTY1NzMzLCJuYmYiOjE3MTg4OTExMDQuNTY1NzM2LCJleHAiOjIxOTIxOTAzMDQuNTYxMjM5LCJzdWIiOiIxIiwic2NvcGVzIjpbXX0.Vg-Xn57w4MCgT3oYaiJ8-9uFDXrog5pcSi4xne-tF1N9QDDtInC23AVqIAXo5RfSHXMwsM9JcEPOEhRkvt4BvYHHFVf7cOd7RcOO2-fjC7o0zXaqgGWU3xcxwx8GzL6LvYit86FZ0DbX03D4re3hRH2xVwVTs7F4qWIY5XWa4ufPoFn-3T99i9NKqsbbRyO5gDoACQ68_otPpJGJyCpggpHEf-XxuY5T_QFF0b6tw96GLW93t6lZfWyD84y5mG_nRcgbs7ibMum9nUEkkLP5gr4tp_CtaAmVnpMbTbVAAR8BukEYFWL1cOeXABUFv8oGoaO8LFElQ24xdub6tt6rFWyIwj02QKeDUFYNLEhO9yasKcOEaPbA1SXgK7ci6fZk2Rr7E4twDFcnubXuTV3DZ08C_qFxCQUwoSdo11RY50-YcmHQ-rlHyxokSu-972RruIKQ8IjOITwVOqDK5M_7k6VK3Ha26JuEGhmW8dWA1EgBHNHvoZP52XtXY3Gs5ICPAJAQZr6j21CndClqJ2EMVa4QY7AIQJDp1mpDTRiRvseVjqgyehltSaC4504AHPuQ21d--cp3YGHvuZkoEUOKgf_mbo0PMjqvvNJ_d2X1uqP7kduJ7fFxMWy4pwzjIPvFQnVZZ1UX14PSJLntFK57HUUSin1wMGq-Qjd4OmjLDsU';

app.use(bodyParser.json());
app.use(express.static('public'));

const getHeaders = () => ({
    'Authorization': `Bearer ${API_TOKEN}`,
    'Accept': 'application/json'
});

// Function to check if an asset is checked out
const isAssetCheckedOut = async (asset_id) => {
    try {
        const response = await axios.get(`${API_URL}/hardware/${asset_id}`, { headers: getHeaders() });
        const asset = response.data;
        return asset.status_label.name.toLowerCase() !== 'available';
    } catch (error) {
        console.error('Error fetching asset status:', error);
        return false; // Assume asset is available if there's an error fetching the status
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

// Endpoint to get assets assigned to a user

app.get('/users/:userId/assets', async (req, res) => {
    const userId = req.params.userId;
    try {
        const response = await axios.get(`${API_URL}/hardware`, {
            headers: getHeaders(),
            params: {
                assigned_to: userId, // This should filter assets assigned to the specified user
                limit: 1000 // Adjust limit as necessary
            }
        });

        // Debug log the response data
        console.log("API Response Data:", response.data);

        // The API may return a data structure where assigned_to is an object, not just an ID.
        // Ensure we're checking against the correct property.
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
        console.log('Checkout payload:', payload);
        const response = await axios.post(`${API_URL}/hardware/${asset_id}/checkout`, payload, { headers: getHeaders() });
        console.log('Checkout response:', response.data);
        res.json(response.data);
    } catch (error) {
        console.error('Error during checkout:', error.response ? error.response.data : error.message);
        res.status(500).json({ error: error.response ? error.response.data : error.message });
    }
});

// Checkin endpoint
app.post('/checkin', async (req, res) => {
    const { asset_id, user_id, checkin_at } = req.body;
    try {
        const payload = {
            checkin_from_type: 'user',
            assigned_user: user_id,
            checkin_at
        };
        console.log('Checkin payload:', payload);
        const response = await axios.post(`${API_URL}/hardware/${asset_id}/checkin`, payload, { headers: getHeaders() });
        console.log('Checkin response:', response.data);
        res.json(response.data);
    } catch (error) {
        console.error('Error during checkin:', error.response ? error.response.data : error.message);
        res.status(500).json({ error: error.response ? error.response.data : error.message });
    }
});

// Serve the checkin page
app.get('/checkin', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'checkin.html'));
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});