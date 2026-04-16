import type { HistoryRecord, PosterRecord } from "../domain/app-data.js";
import { curatedMoviePosterRecords } from "./curated-movie-posters.js";

const legacyDemoPosterRecords: PosterRecord[] = [
  {
    id: "ember-city",
    title: "Ember City",
    summary: "一张把霓虹雨夜、悬疑人物关系和城市压迫感揉在一起的未来惊悚海报。",
    description:
      "这组海报适合作为都市悬疑、近未来犯罪、赛博黑色电影的参考样本。人物与城市灯带形成强对比，适合注入 AI Chat 的叙事语境，也适合在 AI Draw 中拆出色调与构图参数。",
    year: "2026",
    genre: "悬疑",
    region: "上海 / 东京",
    imageUrl:
      "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80",
    layout: "featured",
    tags: ["Neo-Noir", "霓虹", "都市压迫", "高对比"],
    attributes: {
      character: "孤独调查者与模糊反派关系",
      style: "新黑色电影",
      mood: "压迫、危险、深夜感",
      tone: "青蓝混合橙红高对比",
      composition: "人物置中偏下，城市纵深压上来",
      ratio: "2:3 竖版"
    }
  },
  {
    id: "velvet-sunrise",
    title: "Velvet Sunrise",
    summary: "带有老电影颗粒感与浪漫空气感的爱情片海报，强调人像与晨光。",
    description:
      "适合为爱情、文艺、轻治愈题材提供人物质感参考。整体画面柔和，适合在 AI Draw 模式中提取角色、氛围与色调。",
    year: "2025",
    genre: "爱情",
    region: "巴黎",
    imageUrl:
      "https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?auto=format&fit=crop&w=900&q=80",
    layout: "square",
    tags: ["Romance", "晨光", "柔焦", "胶片"],
    attributes: {
      character: "彼此靠近的恋人双人像",
      style: "法式浪漫电影海报",
      mood: "温柔、轻盈、亲密",
      tone: "奶油金与暖粉",
      composition: "半身双人像，轻微对角线",
      ratio: "4:5 竖版"
    }
  },
  {
    id: "atlas-machine",
    title: "Atlas Machine",
    summary: "机械朋克感很强的动作海报，强调金属比例和疾速运动线。",
    description:
      "适合动作、机甲、工业风题材，尤其适合在 AI Draw 模式中抽取构图、比例与风格参考。",
    year: "2024",
    genre: "动作",
    region: "首尔",
    imageUrl:
      "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=900&q=80",
    layout: "tall",
    tags: ["Mecha", "Industrial", "Action", "Speed"],
    attributes: {
      character: "装备外骨骼的高速行动者",
      style: "机械朋克动作海报",
      mood: "高压、冲击、金属兴奋感",
      tone: "钢灰、冷蓝、局部熔橙",
      composition: "低机位仰拍，主体沿对角线冲出",
      ratio: "2:3 竖版"
    }
  },
  {
    id: "summer-dust",
    title: "Summer Dust",
    summary: "以广角景别和人物剪影为主的公路片海报，气质自由但带轻微失落。",
    description:
      "这张海报特别适合作为氛围参考。它不靠复杂元素，而靠留白、远景和空气颜色建立故事感。",
    year: "2023",
    genre: "公路",
    region: "加州",
    imageUrl:
      "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=900&q=80",
    layout: "wide",
    tags: ["Road Movie", "Wide Shot", "Freedom", "Dust"],
    attributes: {
      character: "站在旷野中的孤独旅人",
      style: "美式公路电影海报",
      mood: "自由、空旷、微失落",
      tone: "尘土橙、日落金、褪色蓝",
      composition: "大留白远景，人物只占小比例",
      ratio: "16:9 横版"
    }
  },
  {
    id: "opal-archive",
    title: "Opal Archive",
    summary: "带神秘宗教感和复古拼贴感的奇幻片海报，视觉符号密度更高。",
    description:
      "适合作为奇幻、悬秘、女性主角题材的视觉样本。画面层次复杂，很适合 AI Chat 里作为世界观参考对象。",
    year: "2026",
    genre: "奇幻",
    region: "布拉格",
    imageUrl:
      "https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?auto=format&fit=crop&w=900&q=80",
    layout: "square",
    tags: ["Fantasy", "Collage", "Mystic", "Symbol"],
    attributes: {
      character: "带有仪式感的女性主角",
      style: "复古拼贴奇幻电影海报",
      mood: "神秘、史诗、仪式感",
      tone: "暗红、象牙白、旧金",
      composition: "人物正中，符号环绕",
      ratio: "1:1 海报版"
    }
  },
  {
    id: "monsoon-bird",
    title: "Monsoon Bird",
    summary: "偏作者电影取向的悬疑海报，利用玻璃反射和雨痕制造双层人物叙事。",
    description:
      "适合做人物关系海报、雨夜戏剧海报与情绪悬疑海报的基底。尤其适合作为色调与氛围参考。",
    year: "2025",
    genre: "剧情",
    region: "香港",
    imageUrl:
      "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=900&q=80",
    layout: "tall",
    tags: ["Auteur", "Rain", "Reflection", "Drama"],
    attributes: {
      character: "玻璃前后形成关系张力的双人物",
      style: "作者电影情绪海报",
      mood: "潮湿、暧昧、隐秘",
      tone: "墨绿、酒红、灰蓝",
      composition: "反射叠层构图",
      ratio: "2:3 竖版"
    }
  },
  {
    id: "paper-moon-hotel",
    title: "Paper Moon Hotel",
    summary: "轻喜剧和复古旅馆混合的明快海报，用高饱和道具构建记忆点。",
    description:
      "适合在 AI Draw 中测试角色、风格、构图三者同时存在时的参数协同。视觉可读性强，很适合做推荐位卡面。",
    year: "2024",
    genre: "喜剧",
    region: "台北",
    imageUrl:
      "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=900&q=80",
    layout: "wide",
    tags: ["Comedy", "Retro", "Set Design", "Bright"],
    attributes: {
      character: "在复古旅馆场景中的群像人物",
      style: "复古明快喜剧海报",
      mood: "轻盈、热闹、古怪",
      tone: "薄荷绿、樱桃红、奶油黄",
      composition: "多角色横向分布，场景叙事",
      ratio: "3:2 横版"
    }
  }
];

export const demoPosterRecords: PosterRecord[] = curatedMoviePosterRecords;

export const demoHistoryRecords: HistoryRecord[] = [
  {
    id: "gen-001",
    posterId: "inception",
    mode: "chat",
    status: "succeeded",
    createdAt: "2026-04-10 09:20",
    prompt: "基于《Inception》的梦境层级和城市折叠感，生成一张新的科幻悬疑海报。",
    outputs: 4
  },
  {
    id: "gen-002",
    posterId: "dune",
    mode: "draw",
    status: "running",
    createdAt: "2026-04-10 11:05",
    prompt: "保留沙漠史诗感和人物剪影比例，重做成一张竖版世界观海报。",
    outputs: 2
  },
  {
    id: "gen-003",
    posterId: "spirited-away",
    mode: "draw",
    status: "waiting",
    createdAt: "2026-04-09 21:42",
    prompt: "以奇幻成长故事为核心，增强角色入口、异世界符号和温柔神秘氛围。",
    outputs: 0
  }
];
