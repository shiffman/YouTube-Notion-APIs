const { Client } = require('@notionhq/client');
require('dotenv').config();

const notion = new Client({
  auth: process.env.NOTION_TOKEN,
});

const { google } = require('googleapis');

go();
async function getVideos() {
  const results = await google.youtube('v3').search.list({
    key: process.env.YOUTUBE_TOKEN,
    part: 'snippet',
    channelId: 'UCvjgXvBlbQiydffZU7m1_aw',
    maxResults: 10,
    order: 'date',
  });
  const { data } = results;
  return data.items;
}

async function go() {
  console.log('retrieving latest 50 videos...');
  const videos = await getVideos();
  for (let video of videos) {
    console.log(
      `retrieving stats for ${video.id.videoId} ${video.snippet.title}`
    );
    const info = await google.youtube('v3').videos.list({
      key: process.env.YOUTUBE_TOKEN,
      part: 'statistics',
      id: video.id.videoId,
    });
    const { statistics } = info.data.items[0];
    console.log(
      `Adding to notion: ${video.id.videoId} ${video.snippet.title}`
    );
    await addVideo(video, statistics);
  }
}

async function addVideo(video, statistics) {
  const { videoId } = video.id;
  const { title } = video.snippet;
  const response = await notion.pages.create({
    parent: {
      database_id: process.env.DATABASE_ID,
    },
    properties: {
      Video: {
        title: [
          {
            text: {
              content: `${title} (${videoId})`,
            },
          },
        ],
      },
      // 'Video Title': {
      //   text: { content: title },
      // },
      Views: {
        number: Number(statistics.viewCount),
      },
      Likes: {
        number: Number(statistics.likeCount),
      },
      Dislikes: {
        number: Number(statistics.dislikeCount),
      },
      Comments: {
        number: Number(statistics.commentCount),
      },
    },
  });
}
