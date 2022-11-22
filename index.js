const { Client, IntentsBitField, EmbedBuilder } = require("discord.js");
const axios = require('axios');
require('dotenv').config();

const statusCache = new Map();

const client = new Client({ intents: [IntentsBitField.Flags.Guilds] });
client.login(process.env.DISCORD_TOKEN);

client.on("ready", () => {
    console.log(`Logged in as ${client.user.tag}!`);
    checkStatuses();
    setInterval(checkStatuses, process.env.REQUEST_DELAY);
});

const STATUS = {
    operational: { emoji: "🟢", text: "Operational" },
    degraded_performance: { emoji: "🟡", text: "Degraded Performance" },
    partial_outage: { emoji: "🟠", text: "Partial Outage" },
    major_outage: { emoji: "🔴", text: "Major Outage" }
}

async function checkStatuses() {
    const historyRes = await axios.get("https://status.cfx.re/history.json");
    const history = historyRes.data;

    const statuses = history.components.filter(c => !c.group).map(c => ({ name: c.name, status: c.status }));
    const channel = client.channels.cache.get(process.env.CHANNEL_ID);

    for (let status of statuses) {
        const cachedStatus = statusCache.get(status.name);
        
        if (!cachedStatus && status.status !== "operational") {
            const embed = new EmbedBuilder()
                .setTitle(`FiveM tiene problemas en sus servicios`)
                .setDescription(`🡆 **Servicio:** \`${status.name}\`\n`+
                    `🡆 **Estado actual:** \`${formatStatus(status.status)}\`${moreInfoText}`)
                .setColor("#ff9900")
                .setTimestamp(new Date())
                .setFooter({ text: "FiveM Status Bot", iconURL: "https://i.imgur.com/PIWdc75.png" });

            channel.send({ embeds: [embed] });

        } else if (cachedStatus && cachedStatus.status !== status.status) {
            const embed = new EmbedBuilder()
                .setTitle(`Actualización de estado en FiveM`)
                .setDescription(`🡆 **Servicio:** \`${status.name}\`\n`+
                    `🡆 **Estado actual:** \`${formatStatus(cachedStatus.status)}\` -> \`${formatStatus(status.status)}\`${moreInfoText}`)
                .setColor("#ff9900")
                .setTimestamp(new Date())
                .setFooter({ text: "FiveM Status Bot", iconURL: "https://i.imgur.com/PIWdc75.png" });

            channel.send({ embeds: [embed] });
        } 

        statusCache.set(status.name, status);
    }
}

const moreInfoText = "\n\nPara más información, visita [https://status.cfx.re/](https://status.cfx.re/).";
const formatStatus = (status) => {
    return `${STATUS[status].emoji} ${STATUS[status].text}`;
}