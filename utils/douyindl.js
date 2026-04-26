module.exports.douyindl = async (url) => {
    try {
      function convertDMY(timestamp) {
         const date = new Date(timestamp * 1000);
         return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}:${date.getSeconds().toString().padStart(2, '0')} - ${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()}`;
      }
      const response = await axios.get(url);
      const responseData = response.request.res.responseUrl;
  const urlParts = responseData.split('/');
      const douyin_id = urlParts[urlParts.length - 2];
      const douyin = await axios.get(`https://douyin.wtf/api/douyin/web/fetch_one_video?aweme_id=${douyin_id}`);
      const awemeList = douyin.data?.data.aweme_detail;
      const music = {
        type: "Audio",
        title: awemeList.music.title,
        duration: awemeList.music.duration,
        url: awemeList.music.play_url.url_list[0]
      };
      let result;
      if (awemeList.images) {
        result = {
          type: "Photo",
          id: awemeList.aweme_id,
          title: awemeList.desc,
          nickname: awemeList.author.nickname,
          unique_id: awemeList.author.unique_id,
          create_at: convertDMY(awemeList.create_time),
          commentCount: awemeList.statistics.comment_count,
          likeCount: awemeList.statistics.digg_count,
          playCount: awemeList.statistics.play_count,
          shareCount: awemeList.statistics.share_count,
          collectCount: awemeList.statistics.collect_count,
          url: awemeList.images.map((v) => v.url_list[0]),
          music
        };
      } else {
        result = {
          type: "Video",
          id: awemeList.aweme_id,
          title: awemeList.desc,
          nickname: awemeList.author.nickname,
          unique_id: awemeList.author.unique_id,
          create_at: convertDMY(awemeList.create_time),
          commentCount: awemeList.statistics.comment_count,
          likeCount: awemeList.statistics.digg_count,
          playCount: awemeList.statistics.play_count,
          shareCount: awemeList.statistics.share_count,
          collectCount: awemeList.statistics.collect_count,
          play: awemeList.video.play_addr.url_list[0],
          music
        };
      }
      return result;
    } catch (error) {
      return {message: error.message };
    }
  }