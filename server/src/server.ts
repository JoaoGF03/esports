import express from 'express';
import cors from 'cors'
import { PrismaClient } from '@prisma/client';
import { convertHoursToMinutes } from './utils/convertHoursToMinute';
import { convertMinutesToHours } from './utils/convertMinutesToHours';

const app = express();
app.use(express.json());
app.use(cors())

const prisma = new PrismaClient();

app.get('/games', async (req, res) => {
  const games = await prisma.game.findMany({
    include: {
      _count: {
        select: {
          ads: true,
        },
      }
    },
  });

  return res.json(games);
});

app.post('/games/:id/ads', async (req, res) => {
  const gameId = req.params.id;
  const { name, discord, yearsPlaying, weekDays, hourStart, hourEnd, useVoiceChannel } = req.body

  const ad = await prisma.ad.create({
    data: {
      name,
      discord,
      yearsPlaying,
      weekDays: weekDays.join(','),
      hourStart: convertHoursToMinutes(hourStart),
      hourEnd: convertHoursToMinutes(hourEnd),
      useVoiceChannel,
      gameId
    }
  });

  return res.status(201).json({
    ...ad,
    weekDays: ad.weekDays.split(','),
    hourStart: convertMinutesToHours(ad.hourStart),
    hourEnd: convertMinutesToHours(ad.hourEnd),
  });
});

app.get('/games/:id/ads', async (req, res) => {
  const gameId = req.params.id

  const ads = await prisma.ad.findMany({
    select: {
      id: true,
      name: true,
      hourStart: true,
      hourEnd: true,
      useVoiceChannel: true,
      weekDays: true,
      yearsPlaying: true,
    },
    where: {
      gameId
    },
    orderBy: {
      createdAt: 'desc',
    },
  })

  return res.json(ads.map(ad => ({
    ...ad,
    weekDays: ad.weekDays.split(','),
    hourStart: convertMinutesToHours(ad.hourStart),
    hourEnd: convertMinutesToHours(ad.hourEnd),
  })))

});

app.get('/ads/:id/discord', async (req, res) => {
  const adId = req.params.id

  const ad = await prisma.ad.findUnique({
    select: {
      discord: true,
    },
    where: {
      id: adId
    },
  })

  if (ad)
    return res.json({ discord: ad.discord })

  return res.status(404).json({ message: 'Ad not found' })
});

app.listen(3333, () => {
  console.log('🚀 ~ file: server.js ~ line 10 ~ app.listen ~ 3333')
});