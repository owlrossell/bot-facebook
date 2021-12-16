const express = require("express"),
    bodyParser = require("body-parser"),
    axios = require("axios");
const {Sequelize} = require("sequelize");

const NlpMessage = require("./models/NlpMessage");
const Message = require("./models/Message");
const Nlp = require("./models/Nlp");
const TypeMessage = require("./models/TypeMessage");
const QuickReply = require("./models/QuickReply");
const MessageQuickReply = require("./models/MessageQuickReply");
const Element = require("./models/Element");
const Button = require("./models/Button");
const Postback = require("./models/Postback");
const PostbackMessage = require("./models/PostbackMessage");

require('./models/Relationships');
require('dotenv').config();

const VERIFY_TOKEN = process.env.VERIFY_TOKEN;
const PAGE_ACCESS_TOKEN = process.env.PAGE_ACCESS_TOKEN;

const app = express().use(bodyParser.json());

app.listen(1337, () => {
    console.log('webhook is listening');
});
app.post('/webhook', (req, res) => {
    const body = req.body;
    if (body.object === 'page') {
        body.entry.forEach(function (entry) {
            const webhook_event = entry.messaging[0];
            const sender_psid = webhook_event.sender.id;
            console.log(webhook_event);
            if (webhook_event.message) {
                handleMessage(sender_psid, webhook_event.message);
            }
            if (webhook_event.postback) {
                handlePostback(sender_psid, webhook_event.postback);
            }
        });
        res.status(200).send('EVENT_RECEIVED');
    } else {
        res.sendStatus(404);
    }
});
app.get('/webhook', (req, res) => {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];
    if (mode && token) {
        if (mode === 'subscribe' && token === VERIFY_TOKEN) {
            console.log('WEBHOOK_VERIFIED');
            res.status(200).send(challenge);

        } else {
            res.sendStatus(403);
        }
    }
});

const handleMessage = async (sender_psid, message) => {
    if (message.nlp.intents.length !== 0) {
        let timeOut = 0;
        const mainIntention = message.nlp.intents[0].name;
        // console.log(mainIntention);
        const messages = await Message.findAll({
            include: [{
                model: Nlp,
                where: {
                    intention: mainIntention
                },
                through: {
                    model: NlpMessage,
                    attributes: ['order'],
                }
            }, {
                model: TypeMessage,
                attributes: ['name'],
            }, {
                model: QuickReply,
                through: {
                    model: MessageQuickReply,
                    attributes: ['order']
                }
            }, {
                model: Element,
                include: {
                    model: Button,
                }
            }],
            order: [
                [Sequelize.literal('`Nlps->NlpMessage`.`order`'), 'ASC'],
                [Sequelize.literal('`QuickReplies->MessageQuickReply`.`order`'), 'ASC'],
                [Sequelize.literal('`Elements`.`order`'), 'ASC'],
                [Sequelize.literal('`Elements->Buttons`.`order`'), 'ASC'],
            ]
        });
        // console.log(messages);
        const selectedMessages = [];
        const groupMessages = [];
        for (let counterMessage = 0; counterMessage < messages.length; counterMessage++) {
            const {dataValues} = messages[counterMessage];
            const order = dataValues.Nlps[0].NlpMessage.dataValues.order;
            // console.log(dataValues.Nlps[0].NlpMessage.dataValues.order);
            let isCreated = false;
            for (let counterGroupMessage = 0; counterGroupMessage < groupMessages.length; counterGroupMessage++) {
                if (groupMessages[counterGroupMessage].order === order) {
                    isCreated = true;
                    groupMessages[counterGroupMessage].messages.push(messages[counterMessage]);
                    break;
                }
            }
            if (isCreated === false) {
                groupMessages.push({
                    order,
                    messages: [messages[counterMessage]],
                })
            }
        }

        for (let counterGroupMessage = 0; counterGroupMessage < groupMessages.length; counterGroupMessage++) {
            const lengthOfArray = groupMessages[counterGroupMessage].messages.length;
            if (lengthOfArray > 1) {
                const aleatoryNumber = Math.floor(Math.random() * (lengthOfArray));
                selectedMessages.push(groupMessages[counterGroupMessage].messages[aleatoryNumber]);
            } else {
                selectedMessages.push(groupMessages[counterGroupMessage].messages[0])
            }
        }

        for (let counterMessage = 0; counterMessage < selectedMessages.length; counterMessage++) {
            if (counterMessage === 0) {
                await callSendSender(sender_psid, 'typing_on');
                await sleep(1500);
                await callSendSender(sender_psid, 'typing_off');
            }
            const {dataValues} = selectedMessages[counterMessage];
            // console.log(dataValues);
            let message = {};
            switch (dataValues.TypeMessage.dataValues.name) {
                case 'TEXT':
                    let finalText = dataValues.text;
                    if(finalText.includes('$')) {
                        finalText = finalText.replace('$', await getUserName(sender_psid));
                    }
                    message = {
                        "text": finalText,
                    }
                    timeOut = 0.027 * dataValues.text.length * 1000;
                    break;
                case 'TEMPLATE_GENERIC':
                    timeOut = 2000;
                    const ElementsArray = [];
                    dataValues.Elements.forEach((element) => {
                        const ElementToAdd = {}
                        const {title, subtitle, image_url, default_action, Buttons} = element.dataValues;
                        if (title !== null) ElementToAdd.title = title;
                        if (subtitle !== null) ElementToAdd.subtitle = subtitle;
                        if (image_url !== null) ElementToAdd.image_url = image_url;
                        if (default_action !== null) ElementToAdd.default_action = JSON.parse(default_action);
                        const ButtonsArray = []
                        Buttons.forEach((button) => {
                            const ButtonToAdd = {}
                            const {
                                type,
                                title,
                                payload,
                                url,
                                webview_height_ratio,
                                messenger_extensions,
                                fallback_url,
                                webview_share_button
                            } = button.dataValues;
                            if (type) ButtonToAdd.type = type;
                            if (title) ButtonToAdd.title = title;
                            if (payload) ButtonToAdd.payload = payload;
                            if (url) ButtonToAdd.url = url;
                            if (webview_height_ratio) ButtonToAdd.webview_height_ratio = webview_height_ratio;
                            if (messenger_extensions) ButtonToAdd.messenger_extensions = messenger_extensions;
                            if (fallback_url) ButtonToAdd.fallback_url = fallback_url;
                            if (webview_share_button) ButtonToAdd.webview_share_button = webview_share_button;
                            ButtonsArray.push(ButtonToAdd);
                        });
                        if (ButtonsArray.length > 0) {
                            ElementToAdd.buttons = ButtonsArray;
                        }
                        ElementsArray.push(ElementToAdd);
                        // console.log(element.dataValues);
                    })
                    message = {
                        'attachment': {
                            'type': 'template',
                            'payload': {
                                'template_type': 'generic',
                                'elements': ElementsArray,
                            }
                        }
                    }
                    break;
            }
            let quickRepliesArray = []
            for (let counterQuickReply = 0; counterQuickReply < dataValues.QuickReplies.length; counterQuickReply++) {
                const {contentType, title, payload, imageURL} = dataValues.QuickReplies[counterQuickReply];
                const quickReplyToAdd = {}
                if (contentType !== null) quickReplyToAdd.content_type = contentType;
                if (title !== null) quickReplyToAdd.title = title;
                if (payload !== null) quickReplyToAdd.payload = payload;
                if (imageURL !== null) quickReplyToAdd.image_url = imageURL;
                quickRepliesArray.push(quickReplyToAdd);
            }
            if (quickRepliesArray.length !== 0) {
                message.quick_replies = quickRepliesArray;
            }
            // console.log(message);
            await callSendAPI(sender_psid, message);
            if (counterMessage !== messages.length - 1) {
                await callSendSender(sender_psid, 'typing_on');
                await sleep(timeOut);
                await callSendSender(sender_psid, 'typing_off');
            }
        }
    }
}

const handlePostback = async (sender_psid, {payload}) => {
    let timeOut = 0;
    const messages = await Message.findAll({
        attributes: ['id', 'text'],
        include: [{
            model: Postback,
            where: {
                payload
            },
            through: {
                model: PostbackMessage,
                attributes: ['order'],
            }
        }, {
            model: TypeMessage,
            attributes: ['name'],
        }, {
            model: QuickReply,
            through: {
                model: MessageQuickReply,
                attributes: ['order']
            }
        }, {
            model: Element,
            include: {
                model: Button,
            }
        }],
        order: [
            [Sequelize.literal('`Postbacks->PostbackMessage`.`order`'), 'ASC'],
            [Sequelize.literal('`QuickReplies->MessageQuickReply`.`order`'), 'ASC'],
            [Sequelize.literal('`Elements`.`order`'), 'ASC'],
            [Sequelize.literal('`Elements->Buttons`.`order`'), 'ASC'],
        ]
    });
    const selectedMessages = [];
    const groupMessages = [];
    for (let counterMessage = 0; counterMessage < messages.length; counterMessage++) {
        const {dataValues} = messages[counterMessage];
        const order = dataValues.Postbacks[0].PostbackMessage.dataValues.order;
        // console.log(dataValues.Nlps[0].NlpMessage.dataValues.order);
        let isCreated = false;
        for (let counterGroupMessage = 0; counterGroupMessage < groupMessages.length; counterGroupMessage++) {
            if (groupMessages[counterGroupMessage].order === order) {
                isCreated = true;
                groupMessages[counterGroupMessage].messages.push(messages[counterMessage]);
                break;
            }
        }
        if (isCreated === false) {
            groupMessages.push({
                order,
                messages: [messages[counterMessage]],
            })
        }
    }

    for (let counterGroupMessage = 0; counterGroupMessage < groupMessages.length; counterGroupMessage++) {
        const lengthOfArray = groupMessages[counterGroupMessage].messages.length;
        if (lengthOfArray > 1) {
            const aleatoryNumber = Math.floor(Math.random() * (lengthOfArray));
            selectedMessages.push(groupMessages[counterGroupMessage].messages[aleatoryNumber]);
        } else {
            selectedMessages.push(groupMessages[counterGroupMessage].messages[0])
        }
    }
    for (let counterMessage = 0; counterMessage < selectedMessages.length; counterMessage++) {
        if (counterMessage === 0) {
            await callSendSender(sender_psid, 'typing_on');
            await sleep(1500);
            await callSendSender(sender_psid, 'typing_off');
        }
        const {dataValues} = selectedMessages[counterMessage];
        // console.log(dataValues);
        let message = {};
        switch (dataValues.TypeMessage.dataValues.name) {
            case 'TEXT':
                let finalText = dataValues.text;
                if(finalText.includes('$')) {
                    finalText = finalText.replace('$', await getUserName(sender_psid));
                }
                message = {
                    "text": finalText,
                }
                timeOut = 0.027 * dataValues.text.length * 1000;
                break;
            case 'TEMPLATE_GENERIC':
                timeOut = 2000;
                const ElementsArray = [];
                dataValues.Elements.forEach((element) => {
                    const ElementToAdd = {}
                    const {title, subtitle, image_url, default_action, Buttons} = element.dataValues;
                    if (title !== null) ElementToAdd.title = title;
                    if (subtitle !== null) ElementToAdd.subtitle = subtitle;
                    if (image_url !== null) ElementToAdd.image_url = image_url;
                    if (default_action !== null) ElementToAdd.default_action = JSON.parse(default_action);
                    const ButtonsArray = []
                    Buttons.forEach((button) => {
                        const ButtonToAdd = {}
                        const {
                            type,
                            title,
                            payload,
                            url,
                            webview_height_ratio,
                            messenger_extensions,
                            fallback_url,
                            webview_share_button
                        } = button.dataValues;
                        if (type) ButtonToAdd.type = type;
                        if (title) ButtonToAdd.title = title;
                        if (payload) ButtonToAdd.payload = payload;
                        if (url) ButtonToAdd.url = url;
                        if (webview_height_ratio) ButtonToAdd.webview_height_ratio = webview_height_ratio;
                        if (messenger_extensions) ButtonToAdd.messenger_extensions = messenger_extensions;
                        if (fallback_url) ButtonToAdd.fallback_url = fallback_url;
                        if (webview_share_button) ButtonToAdd.webview_share_button = webview_share_button;
                        ButtonsArray.push(ButtonToAdd);
                    });
                    if (ButtonsArray.length > 0) {
                        ElementToAdd.buttons = ButtonsArray;
                    }
                    ElementsArray.push(ElementToAdd);
                    // console.log(element.dataValues);
                })
                message = {
                    'attachment': {
                        'type': 'template',
                        'payload': {
                            'template_type': 'generic',
                            'elements': ElementsArray,
                        }
                    }
                }
                break;
        }
        let quickRepliesArray = []
        for (let counterQuickReply = 0; counterQuickReply < dataValues.QuickReplies.length; counterQuickReply++) {
            const {contentType, title, payload, imageURL} = dataValues.QuickReplies[counterQuickReply];
            const quickReplyToAdd = {}
            if (contentType !== null) quickReplyToAdd.content_type = contentType;
            if (title !== null) quickReplyToAdd.title = title;
            if (payload !== null) quickReplyToAdd.payload = payload;
            if (imageURL !== null) quickReplyToAdd.image_url = imageURL;
            quickRepliesArray.push(quickReplyToAdd);
        }
        if (quickRepliesArray.length !== 0) {
            message.quick_replies = quickRepliesArray;
        }
        // console.log(message);
        await callSendAPI(sender_psid, message);

        if (counterMessage !== messages.length - 1) {
            await callSendSender(sender_psid, 'typing_on');
            await sleep(timeOut);
            await callSendSender(sender_psid, 'typing_off');
        }
    }
}

const callSendAPI = async (sender_psid, message) => {
    const answer = {
        recipient: {
            'id': sender_psid,
        },
        message
    }
    await axios.post('https://graph.facebook.com/v12.0/me/messages', answer, {
        params: {
            'access_token': PAGE_ACCESS_TOKEN,
        }
    })
}

const sleep = async (delay) => {
    return new Promise(function (resolve) {
        setTimeout(resolve, delay);
    })
}

const callSendSender = async (sender_psid, sender_action) => {
    const answer = {
        recipient: {
            'id': sender_psid,
        },
        sender_action
    }
    await axios.post('https://graph.facebook.com/v12.0/me/messages', answer, {
        params: {
            'access_token': PAGE_ACCESS_TOKEN,
        }
    })
}

const getUserName = async (sender_psid) => {
    const {data} = await axios.get(`https://graph.facebook.com/${sender_psid}`, {
        params: {
            'fields': 'first_name',
            'access_token': PAGE_ACCESS_TOKEN,
        }
    })
    return data.first_name;
}