export type AiDrawOptionPrompt = {
  dimensionKey: string;
  dimensionLabel: string;
  optionDescription: string;
  optionLabel: string;
  optionValue: string;
  prompt: string;
};

export const aiDrawOptionPrompts: AiDrawOptionPrompt[] = [
  {
    dimensionKey: "shotScale",
    dimensionLabel: "人物景别",
    optionLabel: "大远景",
    optionValue: "extreme-long-shot",
    optionDescription: "人物极小，环境尺度主导。",
    prompt: "人物只占画面很小比例，环境尺度压倒人物，用广阔空间、地平线、建筑或自然景观建立电影海报的宏大感。"
  },
  {
    dimensionKey: "shotScale",
    dimensionLabel: "人物景别",
    optionLabel: "远景",
    optionValue: "long-shot",
    optionDescription: "人物完整但环境仍占主导。",
    prompt: "呈现完整人物和大面积环境，让人物可辨识但仍被场景包围，强调行动发生的位置和空间关系。"
  },
  {
    dimensionKey: "shotScale",
    dimensionLabel: "人物景别",
    optionLabel: "全景",
    optionValue: "full-shot",
    optionDescription: "完整人物与主要环境并重。",
    prompt: "完整展示人物全身和主要场景，人物与环境权重接近，适合群像、动作姿态或海报主视觉。"
  },
  {
    dimensionKey: "shotScale",
    dimensionLabel: "人物景别",
    optionLabel: "中全景",
    optionValue: "medium-full-shot",
    optionDescription: "人物从膝部或大半身进入画面。",
    prompt: "人物从膝部或大半身进入画面，保留服装、姿态和周围环境，兼顾叙事动作与人物气质。"
  },
  {
    dimensionKey: "shotScale",
    dimensionLabel: "人物景别",
    optionLabel: "中景",
    optionValue: "medium-shot",
    optionDescription: "人物半身或腰部以上，适合叙事入口。",
    prompt: "人物以半身或腰部以上为主，面部、服装和道具清晰，适合作为电影海报的核心叙事入口。"
  },
  {
    dimensionKey: "shotScale",
    dimensionLabel: "人物景别",
    optionLabel: "中近景",
    optionValue: "medium-close-up",
    optionDescription: "胸像或肩部以上，强化表情。",
    prompt: "人物胸像或肩部以上占据画面，强化表情、眼神和情绪张力，背景只保留关键氛围信息。"
  },
  {
    dimensionKey: "shotScale",
    dimensionLabel: "人物景别",
    optionLabel: "近景",
    optionValue: "close-up",
    optionDescription: "脸部和细节主导情绪。",
    prompt: "脸部和上半身成为主视觉，突出人物心理、皮肤细节、眼神和光影，背景虚化或压暗。"
  },
  {
    dimensionKey: "shotScale",
    dimensionLabel: "人物景别",
    optionLabel: "特写",
    optionValue: "extreme-close-up",
    optionDescription: "局部细节成为主视觉。",
    prompt: "聚焦面部局部、眼睛、手部或关键道具，细节极度放大，形成强符号和强情绪冲击。"
  },
  {
    dimensionKey: "characterPosition",
    dimensionLabel: "人物位置",
    optionLabel: "左侧",
    optionValue: "left",
    optionDescription: "人物在画面左侧，右侧保留叙事空间。",
    prompt: "人物放在画面左侧，右侧保留环境、事件或文字呼吸空间，形成从左向右展开的叙事动线。"
  },
  {
    dimensionKey: "characterPosition",
    dimensionLabel: "人物位置",
    optionLabel: "右侧",
    optionValue: "right",
    optionDescription: "人物在画面右侧，左侧形成视觉对照。",
    prompt: "人物放在画面右侧，左侧安排场景、光源或对照元素，让人物与环境形成清晰的视觉张力。"
  },
  {
    dimensionKey: "characterPosition",
    dimensionLabel: "人物位置",
    optionLabel: "上方",
    optionValue: "top",
    optionDescription: "人物或面部占据上方区域。",
    prompt: "人物或面部占据画面上方区域，下方保留事件现场、空间深度或象征性元素，制造俯视和命运压迫感。"
  },
  {
    dimensionKey: "characterPosition",
    dimensionLabel: "人物位置",
    optionLabel: "下方",
    optionValue: "bottom",
    optionDescription: "人物位于底部或前景低位。",
    prompt: "人物位于画面下方或前景低位，上方留给巨大环境、天空、建筑或威胁物，强化小人物面对大世界的尺度感。"
  },
  {
    dimensionKey: "characterPosition",
    dimensionLabel: "人物位置",
    optionLabel: "中间",
    optionValue: "center",
    optionDescription: "人物成为中心视觉锚点。",
    prompt: "人物位于画面正中，成为最明确的视觉锚点，周围元素围绕人物组织，形成稳定、直接的电影海报主视觉。"
  },
  {
    dimensionKey: "era",
    dimensionLabel: "年代",
    optionLabel: "现代",
    optionValue: "modern",
    optionDescription: "现代都市或现实语境。",
    prompt: "年代设定为现代，使用现代都市建筑、汽车、服装、电子设备和现实生活质感，整体贴近成熟商业电影语境。"
  },
  {
    dimensionKey: "era",
    dimensionLabel: "年代",
    optionLabel: "古代",
    optionValue: "ancient",
    optionDescription: "古典服饰、建筑和器物。",
    prompt: "年代设定为古代，使用传统服饰、木石建筑、宫阙、兵器和手工器物，避免现代科技痕迹。"
  },
  {
    dimensionKey: "era",
    dimensionLabel: "年代",
    optionLabel: "民国",
    optionValue: "republic",
    optionDescription: "民国服饰、建筑和旧上海气质。",
    prompt: "年代设定为民国，加入旗袍、长衫、西装、旧式街灯、海报招贴和老上海建筑气质，带有胶片怀旧感。"
  },
  {
    dimensionKey: "era",
    dimensionLabel: "年代",
    optionLabel: "当代",
    optionValue: "contemporary",
    optionDescription: "当下生活、服化道和空间。",
    prompt: "年代设定为当代，服装、空间、手机、车辆和生活细节都符合当前现实世界，保持真实、即时的社会现场感。"
  },
  {
    dimensionKey: "era",
    dimensionLabel: "年代",
    optionLabel: "八十年代",
    optionValue: "1980s",
    optionDescription: "八十年代质感、服饰和媒介痕迹。",
    prompt: "年代设定为八十年代，使用复古发型、宽肩服装、老式电视、磁带、霓虹招牌和模拟胶片质感。"
  },
  {
    dimensionKey: "era",
    dimensionLabel: "年代",
    optionLabel: "九十年代",
    optionValue: "1990s",
    optionDescription: "九十年代影像与街景语汇。",
    prompt: "年代设定为九十年代，加入胶片颗粒、旧广告牌、早期电子设备、复古街景和偏粗粝的商业电影质感。"
  },
  {
    dimensionKey: "era",
    dimensionLabel: "年代",
    optionLabel: "千禧",
    optionValue: "millennium",
    optionDescription: "Y2K、数码早期和千禧审美。",
    prompt: "年代设定为千禧时期，使用 Y2K 数码感、金属材质、早期互联网设备、亮面服饰和世纪交替的未来乐观情绪。"
  },
  {
    dimensionKey: "era",
    dimensionLabel: "年代",
    optionLabel: "未来",
    optionValue: "future",
    optionDescription: "科幻未来、技术和未知文明。",
    prompt: "年代设定为未来，加入高科技建筑、飞行器、全息界面、未知文明或先进材料，但保持电影级真实可信。"
  },
  {
    dimensionKey: "era",
    dimensionLabel: "年代",
    optionLabel: "中世纪",
    optionValue: "medieval",
    optionDescription: "城堡、盔甲、宗教或封建语境。",
    prompt: "年代设定为中世纪，使用城堡、盔甲、披风、石墙、火把、宗教符号和封建史诗气质。"
  },
  {
    dimensionKey: "era",
    dimensionLabel: "年代",
    optionLabel: "罗马",
    optionValue: "rome",
    optionDescription: "古罗马建筑、服饰和权力结构。",
    prompt: "年代设定为古罗马，加入柱廊、竞技场、雕像、长袍、军团甲胄和帝国权力秩序。"
  },
  {
    dimensionKey: "era",
    dimensionLabel: "年代",
    optionLabel: "战国",
    optionValue: "warring-states",
    optionDescription: "战国器物、甲胄和历史张力。",
    prompt: "年代设定为战国，使用青铜器、甲胄、旌旗、古战场、城墙和诸侯争霸的历史紧张感。"
  },
  {
    dimensionKey: "era",
    dimensionLabel: "年代",
    optionLabel: "盛唐",
    optionValue: "tang",
    optionDescription: "盛唐华丽、宫廷和开放气质。",
    prompt: "年代设定为盛唐，加入华丽衣冠、宫廷建筑、绮丽纹样、灯会、金色装饰和开放繁盛的东方气象。"
  },
  {
    dimensionKey: "era",
    dimensionLabel: "年代",
    optionLabel: "武侠",
    optionValue: "wuxia",
    optionDescription: "江湖、侠客、刀剑和山水。",
    prompt: "年代设定为武侠世界，使用侠客服饰、刀剑、客栈、竹林、山水和江湖漂泊感，动作轻盈而有诗意。"
  },
  {
    dimensionKey: "era",
    dimensionLabel: "年代",
    optionLabel: "仙侠",
    optionValue: "xianxia",
    optionDescription: "仙门、灵气、法术和东方奇幻。",
    prompt: "年代设定为仙侠世界，加入仙门建筑、云海、法阵、灵气光效、飘逸长袍和东方奇幻神话感。"
  },
  {
    dimensionKey: "era",
    dimensionLabel: "年代",
    optionLabel: "西部",
    optionValue: "western",
    optionDescription: "荒野、枪手、尘土和边境感。",
    prompt: "年代设定为西部边境，使用荒野小镇、牛仔帽、左轮枪、尘土、木屋和黄昏逆光。"
  },
  {
    dimensionKey: "era",
    dimensionLabel: "年代",
    optionLabel: "工业",
    optionValue: "industrial",
    optionDescription: "工厂、机械、金属和劳动空间。",
    prompt: "年代设定为工业时代或工业社会，加入工厂、烟囱、钢铁结构、机械零件、蒸汽和劳动现场质感。"
  },
  {
    dimensionKey: "era",
    dimensionLabel: "年代",
    optionLabel: "冷战",
    optionValue: "cold-war",
    optionDescription: "间谍、核阴影和冷峻政治氛围。",
    prompt: "年代设定为冷战时期，使用军事基地、实验室、旧式电话、档案文件、间谍气质和核阴影下的冷峻政治感。"
  },
  {
    dimensionKey: "era",
    dimensionLabel: "年代",
    optionLabel: "昭和",
    optionValue: "showa",
    optionDescription: "昭和日本街景、招牌和胶片感。",
    prompt: "年代设定为昭和时期，加入日本旧街道、木质店铺、纸灯笼、复古招牌和温柔胶片颗粒。"
  },
  {
    dimensionKey: "era",
    dimensionLabel: "年代",
    optionLabel: "史前",
    optionValue: "prehistoric",
    optionDescription: "原始自然、部落或远古生态。",
    prompt: "年代设定为史前，使用原始自然、岩壁、部落服饰、兽骨、火堆、巨型生物或远古生态环境。"
  },
  {
    dimensionKey: "scene",
    dimensionLabel: "场景",
    optionLabel: "城市",
    optionValue: "city",
    optionDescription: "城市建筑、街道或天际线。",
    prompt: "场景设定为城市，加入高楼、街道、车流、玻璃幕墙、霓虹或天际线，让空间具有现代电影的都市张力。"
  },
  {
    dimensionKey: "scene",
    dimensionLabel: "场景",
    optionLabel: "校园",
    optionValue: "campus",
    optionDescription: "教学楼、操场、青春空间。",
    prompt: "场景设定为校园，使用教学楼、走廊、操场、课桌、储物柜或青春人群，带有成长与关系变化的叙事感。"
  },
  {
    dimensionKey: "scene",
    dimensionLabel: "场景",
    optionLabel: "医院",
    optionValue: "hospital",
    optionDescription: "病房、走廊、医疗空间。",
    prompt: "场景设定为医院，加入病房、长走廊、手术灯、白色墙面、医疗设备和冷静紧张的空间秩序。"
  },
  {
    dimensionKey: "scene",
    dimensionLabel: "场景",
    optionLabel: "警局",
    optionValue: "police-station",
    optionDescription: "审讯、档案、制度空间。",
    prompt: "场景设定为警局，使用审讯室、档案柜、玻璃隔断、白板线索、冷光灯和制度化压迫感。"
  },
  {
    dimensionKey: "scene",
    dimensionLabel: "场景",
    optionLabel: "法庭",
    optionValue: "court",
    optionDescription: "审判、席位和秩序感。",
    prompt: "场景设定为法庭，加入审判席、陪审席、木质墙面、证据桌和严肃秩序感，突出对抗与裁决。"
  },
  {
    dimensionKey: "scene",
    dimensionLabel: "场景",
    optionLabel: "太空",
    optionValue: "space",
    optionDescription: "宇宙、飞船或天体背景。",
    prompt: "场景设定为太空，加入星云、星球、飞船、宇航服、舷窗或黑暗宇宙背景，强化未知尺度与孤独感。"
  },
  {
    dimensionKey: "scene",
    dimensionLabel: "场景",
    optionLabel: "深海",
    optionValue: "deep-sea",
    optionDescription: "水下、幽暗和未知生态。",
    prompt: "场景设定为深海，使用水下光束、气泡、漂浮颗粒、幽暗蓝绿空间和未知生物轮廓。"
  },
  {
    dimensionKey: "scene",
    dimensionLabel: "场景",
    optionLabel: "沙漠",
    optionValue: "desert",
    optionDescription: "沙丘、热浪和空旷地平线。",
    prompt: "场景设定为沙漠，加入沙丘、热浪、尘暴、空旷地平线和强烈日光，形成干燥、宏大、危险的空间。"
  },
  {
    dimensionKey: "scene",
    dimensionLabel: "场景",
    optionLabel: "森林",
    optionValue: "forest",
    optionDescription: "树影、自然和遮蔽感。",
    prompt: "场景设定为森林，使用高树、树影、雾气、苔藓、枝叶遮蔽和自然纵深，保留秘密与探索感。"
  },
  {
    dimensionKey: "scene",
    dimensionLabel: "场景",
    optionLabel: "雪地",
    optionValue: "snowfield",
    optionDescription: "冰雪、冷光和荒寒。",
    prompt: "场景设定为雪地，加入冰原、积雪、寒雾、冷光反射和空旷白色环境，强化孤立与严寒。"
  },
  {
    dimensionKey: "scene",
    dimensionLabel: "场景",
    optionLabel: "战场",
    optionValue: "battlefield",
    optionDescription: "冲突现场、烟尘和残骸。",
    prompt: "场景设定为战场，加入烟尘、残骸、旗帜、武器、火光和混乱远景，让冲突规模清晰可见。"
  },
  {
    dimensionKey: "scene",
    dimensionLabel: "场景",
    optionLabel: "废墟",
    optionValue: "ruins",
    optionDescription: "破败建筑、末日和遗迹感。",
    prompt: "场景设定为废墟，使用破败建筑、断墙、碎石、尘埃、荒草和末日遗迹感，强调失序后的世界。"
  },
  {
    dimensionKey: "scene",
    dimensionLabel: "场景",
    optionLabel: "宫廷",
    optionValue: "palace",
    optionDescription: "权力空间、礼制和华丽陈设。",
    prompt: "场景设定为宫廷，加入殿堂、帷幕、阶梯、雕花、仪式陈设和权力中心的华丽秩序。"
  },
  {
    dimensionKey: "scene",
    dimensionLabel: "场景",
    optionLabel: "江湖",
    optionValue: "jianghu",
    optionDescription: "客栈、山林、刀剑与漂泊。",
    prompt: "场景设定为江湖，使用客栈、山路、竹林、渡口、刀剑和漂泊人物，带有武侠片的自由与危险。"
  },
  {
    dimensionKey: "scene",
    dimensionLabel: "场景",
    optionLabel: "公路",
    optionValue: "road",
    optionDescription: "道路、车辆和旅程感。",
    prompt: "场景设定为公路，加入延伸道路、车辆、路牌、远方地平线和旅程感，画面有明确前进方向。"
  },
  {
    dimensionKey: "scene",
    dimensionLabel: "场景",
    optionLabel: "列车",
    optionValue: "train",
    optionDescription: "车厢、站台或铁路运动。",
    prompt: "场景设定为列车，使用车厢、站台、铁轨、窗外流动风景和狭长透视，强化运动与封闭空间张力。"
  },
  {
    dimensionKey: "scene",
    dimensionLabel: "场景",
    optionLabel: "岛屿",
    optionValue: "island",
    optionDescription: "海岸、孤立和边界感。",
    prompt: "场景设定为岛屿，加入海岸线、礁石、孤立建筑、潮水和远处海平面，形成边界与隔绝感。"
  },
  {
    dimensionKey: "scene",
    dimensionLabel: "场景",
    optionLabel: "小镇",
    optionValue: "town",
    optionDescription: "地方生活、人际关系和低密度空间。",
    prompt: "场景设定为小镇，使用低矮建筑、街角店铺、居民生活痕迹和地方性空间，强调人际关系和秘密。"
  },
  {
    dimensionKey: "scene",
    dimensionLabel: "场景",
    optionLabel: "公寓",
    optionValue: "apartment",
    optionDescription: "室内生活空间和私密关系。",
    prompt: "场景设定为公寓，加入客厅、卧室、窗户、家具、个人物件和私密生活痕迹，强化人物关系。"
  },
  {
    dimensionKey: "scene",
    dimensionLabel: "场景",
    optionLabel: "草原",
    optionValue: "grassland",
    optionDescription: "开阔草地、地平线和风。",
    prompt: "场景设定为草原，使用开阔草地、低地平线、风、远山或天空，强调宽广空间和人物孤立。"
  },
  {
    dimensionKey: "scene",
    dimensionLabel: "场景",
    optionLabel: "土房子",
    optionValue: "earth-house",
    optionDescription: "乡土建筑和粗粝质地。",
    prompt: "场景设定为土房子或乡土建筑，加入夯土墙、木门、院落、尘土和粗粝材质，突出地域生活质感。"
  },
  {
    dimensionKey: "style",
    dimensionLabel: "风格",
    optionLabel: "写实",
    optionValue: "realistic",
    optionDescription: "真实摄影和电影剧照质感。",
    prompt: "整体采用写实电影摄影风格，人物、光线、服装、材质和空间都保持真实可信，像高质量电影剧照转化成海报。"
  },
  {
    dimensionKey: "style",
    dimensionLabel: "风格",
    optionLabel: "极简",
    optionValue: "minimal",
    optionDescription: "少元素、高概括、强符号。",
    prompt: "整体采用极简海报风格，减少元素数量，保留强符号、清晰主视觉和大面积留白，让画面高级克制。"
  },
  {
    dimensionKey: "style",
    dimensionLabel: "风格",
    optionLabel: "胶片",
    optionValue: "film",
    optionDescription: "颗粒、冲印和模拟影像感。",
    prompt: "整体采用胶片风格，加入自然颗粒、轻微冲印偏色、模拟影像质感和真实摄影的时间痕迹。"
  },
  {
    dimensionKey: "style",
    dimensionLabel: "风格",
    optionLabel: "赛博",
    optionValue: "cyberpunk",
    optionDescription: "霓虹、科技、城市夜色。",
    prompt: "整体采用赛博风格，使用霓虹灯、雨夜城市、科技界面、金属材质和高反差夜色。"
  },
  {
    dimensionKey: "style",
    dimensionLabel: "风格",
    optionLabel: "水墨",
    optionValue: "ink",
    optionDescription: "东方笔墨、留白和墨色层次。",
    prompt: "整体采用水墨风格，使用东方笔墨、墨色晕染、留白、淡彩和诗意空间层次。"
  },
  {
    dimensionKey: "style",
    dimensionLabel: "风格",
    optionLabel: "手绘",
    optionValue: "hand-drawn",
    optionDescription: "插画笔触和人工绘制感。",
    prompt: "整体采用手绘插画风格，保留可见笔触、人工绘制轮廓、丰富纹理和电影海报式构图。"
  },
  {
    dimensionKey: "style",
    dimensionLabel: "风格",
    optionLabel: "油画",
    optionValue: "oil-painting",
    optionDescription: "厚涂、油彩和古典质地。",
    prompt: "整体采用油画风格，使用厚涂笔触、油彩层次、古典光影和画布质感，形成艺术电影海报气质。"
  },
  {
    dimensionKey: "style",
    dimensionLabel: "风格",
    optionLabel: "素描",
    optionValue: "sketch",
    optionDescription: "线条、明暗和草图质感。",
    prompt: "整体采用素描风格，以线条、明暗排线、纸张纹理和黑白灰层次构建主视觉。"
  },
  {
    dimensionKey: "style",
    dimensionLabel: "风格",
    optionLabel: "动漫",
    optionValue: "anime",
    optionDescription: "动画角色与分镜感。",
    prompt: "整体采用动漫电影风格，人物造型清晰，色块干净，光影带有动画分镜感，同时保持电影海报完成度。"
  },
  {
    dimensionKey: "style",
    dimensionLabel: "风格",
    optionLabel: "港风",
    optionValue: "hong-kong",
    optionDescription: "港片海报、霓虹和复古商业感。",
    prompt: "整体采用港风电影海报风格，加入霓虹、街头夜色、复古商业排版感、强烈人物关系和港片质感。"
  },
  {
    dimensionKey: "style",
    dimensionLabel: "风格",
    optionLabel: "超现实",
    optionValue: "surreal",
    optionDescription: "现实元素错置，制造梦境和寓言感。",
    prompt: "整体采用超现实风格，将真实元素错置、放大、悬浮或重组，制造梦境、寓言和不可能空间。"
  },
  {
    dimensionKey: "atmosphere",
    dimensionLabel: "氛围",
    optionLabel: "温馨",
    optionValue: "warm",
    optionDescription: "柔和亲密，降低冲突感。",
    prompt: "氛围温馨，使用柔和光线、亲密距离、低冲突表情和暖意细节，让画面有被照顾和靠近的感觉。"
  },
  {
    dimensionKey: "atmosphere",
    dimensionLabel: "氛围",
    optionLabel: "孤寂",
    optionValue: "lonely",
    optionDescription: "突出空旷、沉默和人物隔离感。",
    prompt: "氛围孤寂，扩大空旷空间和沉默留白，让人物与环境产生隔离感，情绪安静但深。"
  },
  {
    dimensionKey: "atmosphere",
    dimensionLabel: "氛围",
    optionLabel: "悬疑",
    optionValue: "suspense",
    optionDescription: "保留未解问题和视觉紧张。",
    prompt: "氛围悬疑，保留未解信息、遮挡、阴影和紧张视线，让观众感觉事件即将揭开。"
  },
  {
    dimensionKey: "atmosphere",
    dimensionLabel: "氛围",
    optionLabel: "热血",
    optionValue: "passionate",
    optionDescription: "强化行动力、速度和情绪爆发。",
    prompt: "氛围热血，强化动作姿态、速度线索、强烈表情、火光或高能光效，让画面有爆发力。"
  },
  {
    dimensionKey: "atmosphere",
    dimensionLabel: "氛围",
    optionLabel: "史诗",
    optionValue: "epic",
    optionDescription: "扩大世界观尺度与命运感。",
    prompt: "氛围史诗，扩大世界观尺度，使用远景、宏大环境、命运感光线和庄严人物姿态。"
  },
  {
    dimensionKey: "atmosphere",
    dimensionLabel: "氛围",
    optionLabel: "浪漫",
    optionValue: "romantic",
    optionDescription: "强调关系、凝视和柔性光线。",
    prompt: "氛围浪漫，强调人物关系、凝视、柔性光线、轻微逆光和温柔空间，让情感成为主视觉。"
  },
  {
    dimensionKey: "atmosphere",
    dimensionLabel: "氛围",
    optionLabel: "压抑",
    optionValue: "depressed",
    optionDescription: "低饱和、高压力、呼吸感收紧。",
    prompt: "氛围压抑，降低饱和度，收紧空间和呼吸感，使用沉重阴影、低天花板或逼仄构图。"
  },
  {
    dimensionKey: "atmosphere",
    dimensionLabel: "氛围",
    optionLabel: "神秘",
    optionValue: "mysterious",
    optionDescription: "保留未知符号和仪式感。",
    prompt: "氛围神秘，加入未知符号、雾气、仪式感光源、遮蔽信息和不可解释的空间线索。"
  },
  {
    dimensionKey: "atmosphere",
    dimensionLabel: "氛围",
    optionLabel: "搞笑",
    optionValue: "comic",
    optionDescription: "更轻盈夸张，降低危险感。",
    prompt: "氛围搞笑，使用夸张姿态、轻盈节奏、反差道具和明快表情，降低危险感但保留电影海报张力。"
  },
  {
    dimensionKey: "atmosphere",
    dimensionLabel: "氛围",
    optionLabel: "怀旧",
    optionValue: "nostalgic",
    optionDescription: "旧影像、回忆和时间痕迹。",
    prompt: "氛围怀旧，加入旧影像颗粒、褪色光线、年代物件和回忆感构图，让时间痕迹可见。"
  },
  {
    dimensionKey: "atmosphere",
    dimensionLabel: "氛围",
    optionLabel: "宁静",
    optionValue: "quiet",
    optionDescription: "稳定、留白、低冲突。",
    prompt: "氛围宁静，使用稳定构图、柔和自然光、低冲突动作和适度留白，让画面安定、平和。"
  },
  {
    dimensionKey: "atmosphere",
    dimensionLabel: "氛围",
    optionLabel: "压迫",
    optionValue: "oppressive",
    optionDescription: "强压力、巨大体量或心理压迫。",
    prompt: "氛围压迫，使用巨大体量、低角度、深阴影、逼近的空间或强压力光线，让人物承受明显威胁。"
  },
  {
    dimensionKey: "atmosphere",
    dimensionLabel: "氛围",
    optionLabel: "诡异",
    optionValue: "eerie",
    optionDescription: "不安、错位、异样的静默。",
    prompt: "氛围诡异，加入错位元素、异常静默、不自然姿态、偏冷阴影和让人不安的细节。"
  },
  {
    dimensionKey: "atmosphere",
    dimensionLabel: "氛围",
    optionLabel: "清新",
    optionValue: "fresh",
    optionDescription: "明亮、干净、轻呼吸感。",
    prompt: "氛围清新，使用明亮自然光、干净空间、轻盈色彩和舒展呼吸感，让画面透明、干净。"
  },
  {
    dimensionKey: "atmosphere",
    dimensionLabel: "氛围",
    optionLabel: "肃穆",
    optionValue: "solemn",
    optionDescription: "庄重、克制、仪式化。",
    prompt: "氛围肃穆，使用庄重姿态、克制表情、仪式化空间、低声量色彩和稳定构图。"
  },
  {
    dimensionKey: "atmosphere",
    dimensionLabel: "氛围",
    optionLabel: "奢靡",
    optionValue: "luxurious",
    optionDescription: "华丽材质、灯光与欲望感。",
    prompt: "氛围奢靡，使用华丽材质、金属反光、丝绒、珠宝、暖光和欲望感空间。"
  },
  {
    dimensionKey: "atmosphere",
    dimensionLabel: "氛围",
    optionLabel: "自由",
    optionValue: "free",
    optionDescription: "开放空间和舒展姿态。",
    prompt: "氛围自由，使用开放空间、风、舒展姿态、远方地平线和明快动线，让画面有释放感。"
  },
  {
    dimensionKey: "atmosphere",
    dimensionLabel: "氛围",
    optionLabel: "阴森",
    optionValue: "gloomy",
    optionDescription: "暗处、寒意和危险预兆。",
    prompt: "氛围阴森，使用暗处、冷光、湿冷材质、阴影遮挡和危险预兆，让画面有寒意。"
  },
  {
    dimensionKey: "atmosphere",
    dimensionLabel: "氛围",
    optionLabel: "青春",
    optionValue: "youthful",
    optionDescription: "明快、成长感、群体活力。",
    prompt: "氛围青春，使用明快光线、成长场景、群体互动、校园或街头活力，让画面年轻、有生命力。"
  },
  {
    dimensionKey: "atmosphere",
    dimensionLabel: "氛围",
    optionLabel: "禅意",
    optionValue: "zen",
    optionDescription: "极简、静观、东方留白。",
    prompt: "氛围禅意，使用极简空间、东方留白、自然材质、静观姿态和缓慢光线，强调平衡与内在安静。"
  },
  {
    dimensionKey: "tone",
    dimensionLabel: "色调",
    optionLabel: "青橙",
    optionValue: "teal-orange",
    optionDescription: "青色阴影和橙色高光的电影感。",
    prompt: "色调采用青橙电影色彩，阴影偏青蓝，高光偏橙黄，人物肤色自然，整体有商业大片质感。"
  },
  {
    dimensionKey: "tone",
    dimensionLabel: "色调",
    optionLabel: "黑白",
    optionValue: "black-white",
    optionDescription: "去色、强明暗和经典影像感。",
    prompt: "色调采用黑白影像，去除彩色干扰，强化明暗层次、轮廓、颗粒和经典电影质感。"
  },
  {
    dimensionKey: "tone",
    dimensionLabel: "色调",
    optionLabel: "日系",
    optionValue: "japanese",
    optionDescription: "清淡、柔和、低反差。",
    prompt: "色调采用日系清淡风格，低反差、柔和自然光、浅色背景和轻微空气感，画面安静干净。"
  },
  {
    dimensionKey: "tone",
    dimensionLabel: "色调",
    optionLabel: "暖黄",
    optionValue: "warm-yellow",
    optionDescription: "暖色光、怀旧和亲密感。",
    prompt: "色调采用暖黄色，主光偏金黄或钨丝灯色，带来怀旧、亲密和温暖的电影氛围。"
  },
  {
    dimensionKey: "tone",
    dimensionLabel: "色调",
    optionLabel: "冷蓝",
    optionValue: "cold-blue",
    optionDescription: "冷调夜色、科技或疏离感。",
    prompt: "色调采用冷蓝色，阴影和环境光偏蓝，强化夜色、科技、距离感或心理疏离。"
  },
  {
    dimensionKey: "tone",
    dimensionLabel: "色调",
    optionLabel: "黑金",
    optionValue: "black-gold",
    optionDescription: "黑场和金色高光，偏高级商业感。",
    prompt: "色调采用黑金配色，深黑背景搭配金色高光和精致反光，营造高级、权力和奢华感。"
  },
  {
    dimensionKey: "tone",
    dimensionLabel: "色调",
    optionLabel: "森系",
    optionValue: "forest",
    optionDescription: "绿色、自然和柔软光线。",
    prompt: "色调采用森系绿色，包含树叶、苔藓、柔和自然光和低饱和绿调，整体自然、湿润、安静。"
  },
  {
    dimensionKey: "tone",
    dimensionLabel: "色调",
    optionLabel: "霓虹",
    optionValue: "neon",
    optionDescription: "高亮彩色灯管和夜间城市感。",
    prompt: "色调采用霓虹色彩，使用高亮粉、蓝、紫、绿灯光，形成夜间城市和强视觉冲击。"
  },
  {
    dimensionKey: "tone",
    dimensionLabel: "色调",
    optionLabel: "蓝调",
    optionValue: "blue-tone",
    optionDescription: "整体偏蓝，忧郁或冷静。",
    prompt: "色调整体偏蓝，保留柔和层次和低照度氛围，适合忧郁、冷静、沉默或夜晚情绪。"
  },
  {
    dimensionKey: "tone",
    dimensionLabel: "色调",
    optionLabel: "暖调",
    optionValue: "warm-tone",
    optionDescription: "整体偏暖，亲密或复古。",
    prompt: "色调整体偏暖，使用暖白、橙、棕、金色光线，让画面更亲密、复古或有人情味。"
  },
  {
    dimensionKey: "tone",
    dimensionLabel: "色调",
    optionLabel: "冷调",
    optionValue: "cool-tone",
    optionDescription: "整体偏冷，理性或疏离。",
    prompt: "色调整体偏冷，使用蓝、青、灰色环境光，弱化暖色，让画面理性、疏离、冷静。"
  },
  {
    dimensionKey: "tone",
    dimensionLabel: "色调",
    optionLabel: "暗调",
    optionValue: "dark-tone",
    optionDescription: "低明度、深阴影和强氛围。",
    prompt: "色调采用暗调，整体低明度，深阴影占比高，只用少量关键光源塑造人物和情绪。"
  },
  {
    dimensionKey: "tone",
    dimensionLabel: "色调",
    optionLabel: "红黑",
    optionValue: "red-black",
    optionDescription: "红色冲突和黑色压迫。",
    prompt: "色调采用红黑配色，以深黑压住画面，用红色作为冲突、危险或欲望的高亮。"
  },
  {
    dimensionKey: "tone",
    dimensionLabel: "色调",
    optionLabel: "高饱和",
    optionValue: "high-saturation",
    optionDescription: "强色彩、强视觉冲击。",
    prompt: "色调采用高饱和方案，强化纯色、彩色光和强对比，让海报具有高能量和强视觉记忆点。"
  },
  {
    dimensionKey: "tone",
    dimensionLabel: "色调",
    optionLabel: "莫兰迪",
    optionValue: "morandi",
    optionDescription: "灰调、柔和、低饱和高级感。",
    prompt: "色调采用莫兰迪灰调，低饱和、柔和、带灰度，画面克制、复古且有高级感。"
  },
  {
    dimensionKey: "tone",
    dimensionLabel: "色调",
    optionLabel: "暖黄褪色",
    optionValue: "faded-warm-yellow",
    optionDescription: "旧照片式暖黄和褪色质感。",
    prompt: "色调采用暖黄褪色效果，像旧照片或老胶片，暖光发旧，暗部轻微泛褐，带时间痕迹。"
  },
  {
    dimensionKey: "composition",
    dimensionLabel: "构图",
    optionLabel: "中心对称构图",
    optionValue: "center-symmetry",
    optionDescription: "主视觉居中，左右稳定对称。",
    prompt: "构图采用中心对称，主视觉严格居中，左右元素保持稳定平衡，形成庄重、清晰、海报感强的布局。"
  },
  {
    dimensionKey: "composition",
    dimensionLabel: "构图",
    optionLabel: "三分法构图",
    optionValue: "rule-of-thirds",
    optionDescription: "主体落在三分线或交点。",
    prompt: "构图采用三分法，将主体放在三分线或交点上，保留一侧环境信息，让画面自然、有呼吸。"
  },
  {
    dimensionKey: "composition",
    dimensionLabel: "构图",
    optionLabel: "对角线构图",
    optionValue: "diagonal",
    optionDescription: "用斜线制造运动和张力。",
    prompt: "构图采用对角线组织，用道路、光线、人物动作或建筑斜线制造运动感和视觉张力。"
  },
  {
    dimensionKey: "composition",
    dimensionLabel: "构图",
    optionLabel: "框架式构图",
    optionValue: "frame-within-frame",
    optionDescription: "门、窗、物体形成二级框架。",
    prompt: "构图采用框架式结构，用门、窗、拱廊、树枝或物体边缘包围主体，形成画中画和被观察感。"
  },
  {
    dimensionKey: "composition",
    dimensionLabel: "构图",
    optionLabel: "引导线构图",
    optionValue: "leading-lines",
    optionDescription: "道路、光线或建筑线条引导视线。",
    prompt: "构图采用引导线，道路、走廊、建筑边缘或光束从前景指向主体，引导观众视线进入画面。"
  },
  {
    dimensionKey: "composition",
    dimensionLabel: "构图",
    optionLabel: "满版型构图",
    optionValue: "full-bleed",
    optionDescription: "画面被主体和信息强占满。",
    prompt: "构图采用满版型，人物、场景和关键元素铺满画面，信息密度高，形成强烈商业海报冲击。"
  },
  {
    dimensionKey: "composition",
    dimensionLabel: "构图",
    optionLabel: "留白型构图",
    optionValue: "negative-space",
    optionDescription: "用空白强化情绪和尺度。",
    prompt: "构图采用留白型，大面积空白或单纯背景包围主体，用空间强化孤独、尺度、悬念或高级感。"
  },
  {
    dimensionKey: "composition",
    dimensionLabel: "构图",
    optionLabel: "上下分割构图",
    optionValue: "top-bottom-split",
    optionDescription: "上下两块视觉叙事形成对照。",
    prompt: "构图采用上下分割，上半部和下半部承载不同场景、人物或情绪，形成阶层、命运或时间对照。"
  },
  {
    dimensionKey: "composition",
    dimensionLabel: "构图",
    optionLabel: "左右分割构图",
    optionValue: "left-right-split",
    optionDescription: "左右两块视觉叙事形成对照。",
    prompt: "构图采用左右分割，左右两侧安排不同人物、空间或色彩，形成对立、选择或双重世界。"
  },
  {
    dimensionKey: "composition",
    dimensionLabel: "构图",
    optionLabel: "特写面部构图",
    optionValue: "face-closeup",
    optionDescription: "面部成为主要海报入口。",
    prompt: "构图采用特写面部，人物面孔成为绝对主视觉，眼神、皮肤纹理和局部阴影承担情绪叙事。"
  },
  {
    dimensionKey: "composition",
    dimensionLabel: "构图",
    optionLabel: "俯视构图",
    optionValue: "overhead",
    optionDescription: "从上方向下观察，建立秩序感。",
    prompt: "构图采用俯视视角，从上方向下观察人物和空间，让场景关系、秩序或被困状态更清晰。"
  },
  {
    dimensionKey: "composition",
    dimensionLabel: "构图",
    optionLabel: "仰视构图",
    optionValue: "low-angle",
    optionDescription: "从下往上看，放大压迫或英雄感。",
    prompt: "构图采用仰视视角，从下往上观察主体，放大人物、建筑或威胁物，制造英雄感或压迫感。"
  },
  {
    dimensionKey: "composition",
    dimensionLabel: "构图",
    optionLabel: "剪影构图",
    optionValue: "silhouette",
    optionDescription: "人物以轮廓和逆光为主。",
    prompt: "构图采用剪影方式，让人物主要以轮廓、逆光和姿态识别，弱化面部细节，突出符号感。"
  },
  {
    dimensionKey: "composition",
    dimensionLabel: "构图",
    optionLabel: "倾斜构图",
    optionValue: "dutch-angle",
    optionDescription: "画面倾斜，制造不稳定。",
    prompt: "构图采用倾斜角度，让水平线和建筑线条偏斜，制造失衡、不安、速度或心理崩塌感。"
  },
  {
    dimensionKey: "composition",
    dimensionLabel: "构图",
    optionLabel: "倒影构图",
    optionValue: "reflection",
    optionDescription: "用镜面、水面或玻璃制造双重叙事。",
    prompt: "构图采用倒影结构，利用镜面、水面、玻璃或金属反射形成双重画面，暗示身份、记忆或现实反转。"
  }
];

export const expectedAiDrawOptionPromptCounts = {
  atmosphere: 20,
  characterPosition: 5,
  composition: 15,
  era: 19,
  scene: 21,
  shotScale: 8,
  style: 11,
  tone: 16
} satisfies Record<string, number>;

function countByDimension(rows: AiDrawOptionPrompt[]) {
  return rows.reduce<Record<string, number>>((counts, row) => {
    counts[row.dimensionKey] = (counts[row.dimensionKey] ?? 0) + 1;
    return counts;
  }, {});
}

export const aiDrawOptionPromptCounts = countByDimension(aiDrawOptionPrompts);

const optionPromptByValue = new Map(
  aiDrawOptionPrompts.map((option) => [`${option.dimensionKey}:${option.optionValue}`, option])
);

const optionPromptByLabel = new Map(
  aiDrawOptionPrompts.map((option) => [`${option.dimensionKey}:${option.optionLabel}`, option])
);

export function getAiDrawOptionPrompt(dimensionKey: string, optionValue: string) {
  return optionPromptByValue.get(`${dimensionKey}:${optionValue}`) ?? null;
}

export function resolveAiDrawOptionPrompt({
  dimensionKey,
  optionLabel,
  optionValue
}: {
  dimensionKey: string;
  optionLabel: string;
  optionValue: string;
}) {
  return (
    optionPromptByValue.get(`${dimensionKey}:${optionValue}`) ??
    optionPromptByLabel.get(`${dimensionKey}:${optionLabel}`) ??
    null
  );
}

export function validateAiDrawOptionPromptCounts() {
  return Object.entries(expectedAiDrawOptionPromptCounts)
    .filter(([dimensionKey, expected]) => aiDrawOptionPromptCounts[dimensionKey] !== expected)
    .map(([dimensionKey, expected]) => ({
      actual: aiDrawOptionPromptCounts[dimensionKey] ?? 0,
      dimensionKey,
      expected
    }));
}
