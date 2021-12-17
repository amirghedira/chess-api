const User = require('../models/User')
const Token = require('../models/Token')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')


exports.createUser = async (req, res) => {
    try {
        const user = await User.findOne({ username: req.body.username, });
        if (user) {
            res.status(409).json({
                message: "user already exists",
            });
        } else {
            const hashedPass = await bcrypt.hash(req.body.password, 11);
            if (!req.body.profileImage)
                req.body.profileImage = `https://avatars.dicebear.com/api/initials/${req.body.username}.svg`
            const createdUser = await User.create({ ...req.body, password: hashedPass, joined: new Date().toISOString() })
            res.status(200).json({ user: createdUser });
        }
    } catch (error) {
        console.log(error)
        res.status(500).json({ error: error.message });
    }
};



exports.userLogin = async (req, res) => {
    try {
        const user = await User.findOne({ username: req.body.username }).exec();
        if (user) {
            const result = await bcrypt.compare(req.body.password, user.password);
            if (result) {
                const payload = { _id: user._id, username: user.username }
                const accessToken = jwt.sign(payload, process.env.ACCESS_TOKEN_KEY, {
                    expiresIn: "1h",
                });
                const refreshToken = jwt.sign(payload, process.env.REFRESH_TOKEN_KEY);
                await Token.create({
                    token: refreshToken,
                    user: user._id,
                });

                res.status(200).json({ accessToken });
            } else {
                res.status(400).json("Auth failed");
            }
        } else {
            res.status(400).json("Auth failed");
        }
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: error.message });
    }
};








exports.getConnectedUser = async (req, res) => {
    try {
        const user = await User.findOne({ _id: req.user._id })
        res.status(200).json({ connectedUser: user })
    } catch (error) {
        console.log(error)
        res.status(500).json({ error: error.message });

    }
}




exports.verifyUser = async (req, res) => {
    try {
        const userPayload = jwt.verify(
            req.params.token,
            process.env.ACCESS_TOKEN_KEY
        );
        const user = await User.findOne({
            _id: userPayload._id,
        });
        if (user) {
            if (!user.confirmed) {
                user.confirmed = true;
                await user.save();
            }
            res.status(200).json({
                message: "user verified",
                email: user.email,
            });
        } else
            res.status(404).json({
                message: "user not found",
            });
    } catch (error) {
        console.log(error);
        res.status(400).json({
            message: "invalid token",
        });
    }
};




exports.updateUserInfo = async (req, res) => {
    try {
        const updateOps = {};
        for (const ops of req.body) {
            updateOps[ops.propName] = ops.value;
        }
        await User.updateOne(
            { _id: req.user._id },
            { $set: updateOps },
        );
        res.status(200).json({ message: 'Updated successfully' });
    } catch (error) {
        res.status(500).json({ error: error });
    }
}




exports.updateUserPassword = async (req, res) => {
    try {

        const user = await User.findOne({ _id: req.user._id });
        if (!user) {
            res.status(401).json({ message: 'Invalid user.' });
        } else {
            let isValid = await bcrypt.compare(req.body.password, user.password);
            if (!isValid) {
                res.status(401).json({ message: 'Invalid password.' });
            } else {
                hashedPassword = await bcrypt.hash(req.body.newPassword, 11);
                user.password = hashedPassword;
                await user.save();
                res.status(200).json({ message: 'Password updated Successfully!' });
            }
        }
    } catch (error) {
        res.status(500).json({ error: error });
    }
};



exports.userLogout = async (req, res) => {
    try {
        await Token.deleteOne({
            user: req.user._id,
        });
        res.status(200).json({
            message: "user logged out",
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};


exports.updateAccessToken = async (req, res) => {
    try {
        if (req.body.accessToken == null) {
            return res.status(403).json({
                message: "access denied",
            });
        }

        const decodedUser = jwt.decode(req.body.accessToken);
        const refreshToken = await Token.findOne({ user: decodedUser._id }).populate('user').exec();

        if (refreshToken) {
            const payload = {
                _id: refreshToken.user._id,
                email: refreshToken.user.email
            };
            const accessToken = jwt.sign(payload, process.env.ACCESS_TOKEN_KEY, {
                expiresIn: "1h",
            });

            return res.status(200).json({
                accessToken,
            });
        }
        return res.status(403).json({
            message: "access denied",
        });
    } catch (error) {
        console.log(error)
        return res.status(500).json({ error: error });
    }
};









