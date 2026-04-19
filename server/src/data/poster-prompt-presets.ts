import type { PosterDrawDimensionKey, PosterPromptPresets } from "../domain/app-data.js";

type DrawDimensions = Record<PosterDrawDimensionKey, string>;

type PresetInput = {
  chatFocus: string;
  chatVisual: string;
  dimensions: Omit<DrawDimensions, "event">;
  title: string;
};

const aiChatPromptsByTitle = {
  "Inception":
    "一张电影级海报，现代城市街道场景，高楼林立，其中一侧城市向天空垂直折叠，形成不可能的空间结构，超现实建筑，梦境般的城市，画面为广角透视，中心构图，街道中间站着5-6个穿西装的人物，神情严肃，彼此分散站位，前景中央为主角，手持手枪，事件表现为梦境盗取行动中的城市空间崩塌，电影感群像，整体氛围冷色调，蓝绿色为主，轻微雾气，体积光，强对比阴影，光线从街道尽头射入，层次分明，好莱坞大片风格，IMAX质感，超清细节，真实质感，景深，8K，电影灯光。",
  "The Matrix":
    "一张电影级海报，未来赛博城市与虚拟系统空间场景，黑色背景中下落绿色代码雨，湿冷街道和高楼形成垂直压迫，中心站着一位穿黑色长风衣和墨镜的人物，身后有2-3名反抗者剪影，事件表现为主角觉醒并准备突破虚拟世界，中心对称构图，中景人物，冷绿色与深黑色调，高反差霓虹边缘光，压迫、神秘、反乌托邦氛围，赛博朋克动作片风格，电影灯光，真实皮革质感，超清细节，8K。",
  "Parasite":
    "一张电影级海报，当代豪宅庭院与半地下住宅对照场景，修剪整齐的草坪、玻璃建筑和阴影中的贫困空间上下分割，人物为几位家庭成员，分散站在画面中间，眼部被黑色横条遮挡，神情克制而不安，事件表现为两个阶层家庭互相渗透并隐藏秘密，构图为上下分割与冷静群像，写实社会惊悚风格，低饱和冷调色调，阳光表面温和但阴影沉重，压抑、讽刺、危险氛围，清晰建筑线条，电影级质感，细节丰富，8K。",
  "Spirited Away":
    "一张电影级海报，动画质感，千禧年代感的异世界浴场与宫殿街道场景，夜幕中灯笼和蒸汽铺满画面，一位少女站在桥上或入口中央，身旁有半透明神灵、白龙剪影和奇异面具角色，事件表现为少女误入神灵世界并寻找回家的路，满版构图，人物中间偏小，被巨大建筑和灯火包围，手绘动漫风格，暖黄色调与深蓝夜色对比，神秘、温暖、冒险氛围，丰富细节，柔和体积光，电影感景深，8K。",
  "The Godfather":
    "一张电影级海报，现代黑帮家族书房或暗色公寓场景，黑色背景中只有顶光照亮一位年长男性的脸和西装领口，人物位于画面中心，近景特写，手部隐约握着权力象征道具，事件表现为家族首领在阴影中做出命运交易，特写面部构图，写实黑帮史诗风格，深黑与暖白低调色调，肃穆、压迫、权力感氛围，大面积留白，强对比阴影，细腻皮肤纹理，电影灯光，8K。",
  "Pulp Fiction":
    "一张电影级海报，九十年代廉价小说封面质感的公寓或旅馆房间场景，暖黄旧纸色背景，一位黑发女性躺在床上或地毯上，手边有香烟、书本和手枪道具，眼神挑衅，事件表现为犯罪故事即将失控的瞬间，三分法构图，中景人物，胶片犯罪风格，胶片颗粒与复古印刷质感，暖黄、红黑阴影色调，诡异、危险、黑色幽默氛围，低机位视角，锐利轮廓光，真实质感，8K。",
  "The Dark Knight":
    "一张电影级海报，当代城市夜景和燃烧街区场景，高楼玻璃幕墙在冷蓝夜色中坍塌或冒烟，中心站着一位披黑色披风的孤独英雄剪影，背后远处有火焰形成抽象符号，事件表现为城市陷入犯罪危机而守护者独自面对混乱，中心对称构图，中景人物，写实超级英雄犯罪史诗风格，冷蓝色调配橙色火光，高压、压迫、悲壮氛围，强对比阴影，雨雾，电影灯光，IMAX质感，8K。",
  "La La Land":
    "一张电影级海报，当代洛杉矶山顶街道或夜色观景台场景，远处城市灯海和紫蓝天空铺开，一男一女在画面中央跳舞，动作舒展，像舞台剪影，事件表现为两位追梦者在城市夜晚坠入浪漫歌舞瞬间，对角线构图，全景人物，写实歌舞爱情片风格，蓝紫色调配暖黄路灯，浪漫、轻盈、怀旧氛围，柔和聚光，细腻颗粒，清晰天际线，电影灯光，8K。",
  "Mad Max: Fury Road":
    "一张电影级海报，未来末日沙漠战场场景，橙色沙尘暴覆盖天空，改装战车从地平线冲出，中心人物穿破旧战斗服站在车队前方，身旁有光头女战士和幸存者剪影，事件表现为末日车队高速追逐与荒漠逃亡，满版构图，中景群像，写实动作大片风格，青橙强对比色调，热血、狂暴、危险氛围，爆炸火光，飞扬尘土，金属机械细节，强烈动势，IMAX质感，8K。",
  "Arrival":
    "一张电影级海报，未来草原与雾气山谷场景，巨大的黑色椭圆外星飞行物垂直悬停在地平线上，低空有直升机和小型车队，一位女性语言学家和一名男性科学家站在前景右侧，军人位于下方，事件表现为人类第一次接触未知文明，左右分割构图，中景人物，超现实极简科幻风格，青橙与冷灰色调，压迫、静默、神秘氛围，厚重云层，体积雾，逆光轮廓，真实质感，8K，电影灯光。",
  "Blade Runner 2049":
    "一张电影级海报，未来赛博都市与荒原交界场景，一侧是冷蓝雨夜霓虹城市，一侧是橙色沙尘废墟，右侧站着穿长外套的孤独男性人物，远处有巨大女性全息影像和飞行器光点，事件表现为复制人与侦探追寻身份真相，左右分割构图，中景人物，赛博黑色电影风格，青橙色调，孤寂、迷离、压迫氛围，雨雾、尘雾和硬质边缘光，真实质感，超清细节，8K。",
  "Interstellar":
    "一张电影级海报，未来太空与荒凉冰原或星球地表场景，巨大黑洞或星体悬在天空，宇航员穿白色宇航服站在画面中央偏下，人物在宇宙尺度中显得渺小，事件表现为人类穿越星际寻找新家园，留白型构图，远景人物，写实硬科幻史诗风格，冷蓝与银白色调，孤独、史诗、敬畏氛围，低地平线，柔和星光，体积雾，电影级景深，IMAX质感，8K。",
  "Everything Everywhere All at Once":
    "一张电影级海报，当代城市洗衣店与多元宇宙拼贴场景，中心女性人物被旋涡状宇宙光环包围，周围漂浮着不同身份版本的人物、道具、眼睛符号、武术动作和家庭生活碎片，事件表现为普通家庭被卷入多元宇宙危机，满版构图，中景群像，超现实喜剧动作风格，高饱和彩虹与霓虹色调，荒诞、搞笑、热闹又情绪化的氛围，层次密集，动感光轨，超清细节，8K，电影灯光。",
  "Dune":
    "一张电影级海报，未来沙漠星球场景，巨大的沙丘和远处行星天空压住画面，中心站着年轻王子、女性战士与家族成员群像，前景有沙尘和武器，远处隐约出现巨型沙虫痕迹，事件表现为预言之子踏入沙漠命运，中心对称构图，中近景人物，写实太空史诗风格，暖黄低饱和沙色调，史诗、肃穆、压迫氛围，逆光尘埃，宏大尺度，IMAX质感，真实服装纹理，8K。",
  "Dune: Part Two":
    "一张电影级海报，未来沙漠战场场景，橙色尘暴和烈日充满天空，中心人物披斗篷站在沙丘前，身旁有女性战士和不同阵营人物，远处军队与巨型沙虫形成战争轮廓，事件表现为沙漠民族发动圣战前的集结，满版构图，中景群像，写实科幻史诗风格，暖黄与深黑阴影色调，压迫、热烈、宗教史诗氛围，硬光、飞沙、强对比轮廓，IMAX质感，超清细节，8K。",
  "The Grand Budapest Hotel":
    "一张电影级海报，昭和复古感的欧洲山间酒店场景，粉紫色大酒店正面占据画面中央，建筑像精致舞台模型，门口站着穿制服的礼宾员和年轻门童，窗户里有客人剪影，事件表现为一场荒诞遗产案件从豪华酒店展开，中心对称构图，全景人物，极简复古喜剧风格，莫兰迪粉、紫、红色调，搞笑、优雅、童话感氛围，平面化光线，干净边缘，微缩景观质感，8K。",
  "Her":
    "一张电影级海报，柔和未来公寓与城市室内场景，大面积红色背景或暖色墙面，人物为一位孤独男性，戴着耳机站在画面中心，近景脸部温柔而失神，窗外是低饱和未来城市，事件表现为人与无形人工智能建立亲密关系，特写面部构图，写实温柔科幻爱情风格，红黑与暖橙色调，孤寂、亲密、安静氛围，浅景深，柔光，细腻皮肤质感，大面积留白，8K，电影灯光。",
  "Get Out":
    "一张电影级海报，当代郊区别墅或黑暗房间场景，背景几乎被阴影吞没，中心人物是一位年轻男性惊恐的脸部近景，眼睛睁大，脸上有泪光，身体像被困在黑暗空间中，事件表现为主角意识到自己被操控并试图逃离，特写面部构图，写实心理恐怖风格，暗调黑蓝色调，高反差阴影，悬疑、压迫、不安氛围，聚焦眼神，细微冷光，真实质感，8K。",
  "Black Swan":
    "一张电影级海报，当代芭蕾舞台与黑暗后台场景，中心人物是一位芭蕾舞者的脸部特写，白色舞妆、黑色眼妆和羽毛纹理融合在皮肤上，嘴唇带深红色，事件表现为舞者在完美表演中走向心理分裂，特写面部构图，写实舞台惊悚风格，黑白色调配红色点缀，诡异、优雅、危险氛围，极简背景，强聚光，裂纹细节，清晰皮肤与羽毛质感，8K。",
  "Moonlight":
    "一张电影级海报，当代迈阿密城市夜晚与海边街区场景，中心人物以一张男性面孔呈现，被分成三个成长阶段的蓝色拼贴，眼神安静而克制，背景有月光、海水和低矮住宅轮廓，事件表现为一个人在成长中寻找身份、爱与自我，特写面部构图，写实诗意现实主义风格，蓝调与紫色低照度色调，孤寂、温柔、沉默氛围，柔和月光，浅景深，细腻颗粒，8K，电影灯光。",
  "Whiplash":
    "一张电影级海报，当代音乐学院排练室或爵士舞台场景，黑暗背景中一位年轻鼓手坐在架子鼓前，汗水和鼓槌动作被暖色聚光照亮，远处有严厉导师的阴影，事件表现为极限训练和音乐竞争爆发前的瞬间，留白型构图，中景人物，写实音乐剧情片风格，暖黄和深黑色调，压迫、热血、紧绷氛围，强聚光，飞散汗水，乐器金属质感，电影灯光，8K。",
  "The Social Network":
    "一张电影级海报，当代大学校园与玻璃办公室场景，冷蓝屏幕光覆盖一位年轻创业者的脸部近景，背景隐约有代码、社交网络界面和法律文件纹理，人物站在画面中心，表情冷静疏离，事件表现为社交平台崛起伴随背叛与诉讼，特写面部构图，写实商业传记风格，冷蓝灰色调，孤寂、克制、审判感氛围，玻璃反射，浅景深，高级冷光，真实质感，8K。",
  "No Country for Old Men":
    "一张电影级海报，西部荒漠公路与汽车旅馆边缘场景，褪色黄昏光铺在空旷地平线，左侧站着持猎枪或气瓶武器的沉默追猎者，远处有逃亡者和警长剪影，事件表现为一场金钱引发的追杀横穿荒原，留白型构图，中景人物，写实犯罪西部惊悚风格，暖黄褪色色调，压迫、宿命、荒凉氛围，粗粝胶片颗粒，长阴影，风尘，真实质感，8K。",
  "The Shape of Water":
    "一张电影级海报，冷战年代实验室与水下空间交叠场景，青绿色水光包围画面，一位女性与神秘水生人形生物在水中相拥漂浮，周围有气泡、玻璃水箱和复古实验设备，事件表现为孤独清洁工与被囚禁生物秘密相爱，中心对称构图，中景人物，超现实复古童话风格，森系青绿与深蓝色调，浪漫、神秘、危险氛围，水波体积光，漂浮感，真实质感，8K。",
  "Pan's Labyrinth":
    "一张电影级海报，冷战阴影下的森林与古老迷宫场景，石质拱门和扭曲树根形成天然框架，一位小女孩站在画面中央，手持小书或钥匙，身后有鹿角怪物和阴影中的战争士兵，事件表现为女孩进入黑暗童话世界完成试炼，框架式构图，中景人物，超现实黑暗奇幻风格，暗调蓝绿色调配暖金点光，神秘、阴森、寓言氛围，雾气，树影，烛光，细节丰富，8K。",
  "Amelie":
    "一张电影级海报，现代巴黎街角咖啡馆与复古公寓场景，红绿色室内布景温暖鲜明，一位短发年轻女性位于画面中央近景，带着狡黠微笑，周围有水果摊、相框、旧照片和小物件，事件表现为她用奇想方式改变陌生人的生活，中心对称构图，近景人物，胶片法式浪漫喜剧风格，暖黄、红、绿色调，温馨、俏皮、怀旧氛围，柔和灯光，轻微颗粒，真实质感，8K。",
  "Crouching Tiger, Hidden Dragon":
    "一张电影级海报，古代武侠竹林与东方山水场景，高耸竹子形成冷绿色纵深，两位持剑侠客在空中或竹梢间交错飞掠，中央有女性剑客身姿轻盈，事件表现为围绕名剑和压抑情感展开的江湖追逐，对角线构图，全景人物，水墨武侠风格，森系冷绿与淡青色调，自由、诗意、克制氛围，飘逸衣袂，雾气留白，动势清晰，电影灯光，8K。",
  "The Lord of the Rings: The Fellowship of the Ring":
    "一张电影级海报，中世纪奇幻森林与远山场景，古老道路从前景通向迷雾山脉，中央站着远征小队群像，人物为矮人、精灵、巫师和年轻旅人分层排列，前景有发光戒指符号，事件表现为护戒队踏上拯救世界的旅程，满版构图，中景群像，写实史诗奇幻风格，暖金色调配冷蓝阴影，史诗、冒险、命运召唤氛围，层次丰富，体积光，真实服装与武器质感，8K。",
  "The Silence of the Lambs":
    "一张电影级海报，九十年代警局与心理审讯空间场景，苍白背景中女性调查员人物的脸部极近特写位于中心，嘴部前方停着带骷髅纹的飞蛾符号，眼神冷静但恐惧，事件表现为调查员进入连环杀手心理迷宫，特写面部构图，写实心理犯罪惊悚风格，暗调、灰白与冷蓝色调，阴森、静默、悬疑氛围，极简留白，锐利对焦，细腻皮肤纹理，8K，电影灯光。",
  "Fight Club":
    "一张电影级海报，九十年代都市地下室与广告灯箱场景，潮湿水泥墙、粉色肥皂和冷色荧光灯形成背景，画面中央站着两个男性人物，一个衣着普通神情疲惫，一个穿红色皮夹克姿态挑衅，事件表现为地下搏击组织和反消费叛乱失控，中心对称构图，中近景双人，胶片心理惊悚风格，红黑与脏粉色调，诡异、叛逆、危险氛围，粗粝颗粒，强阴影，真实质感，8K。"
} as const;

function buildFallbackAiChatPrompt(input: PresetInput) {
  return [
    `一张电影级海报，${input.dimensions.era}${input.dimensions.scene}场景，${input.chatFocus}`,
    `${input.chatVisual}`,
    `人物景别为${input.dimensions.shotScale}，人物位置为${input.dimensions.characterPosition}，构图为${input.dimensions.composition}，整体风格为${input.dimensions.style}，氛围为${input.dimensions.atmosphere}，色调为${input.dimensions.tone}，事件表现为围绕主视觉展开的电影关键瞬间，电影灯光，真实质感，超清细节，8K。`
  ].join("，");
}

function createPreset(input: PresetInput): PosterPromptPresets {
  const dimensions: DrawDimensions = {
    ...input.dimensions,
    event: ""
  };

  const dimensionLines = [
    `人物景别：${dimensions.shotScale}`,
    `人物位置：${dimensions.characterPosition}`,
    "事件：（用户自填）",
    `年代：${dimensions.era}`,
    `场景：${dimensions.scene}`,
    `风格：${dimensions.style}`,
    `氛围：${dimensions.atmosphere}`,
    `色调：${dimensions.tone}`,
    `构图：${dimensions.composition}`
  ];

  return {
    aiChat: aiChatPromptsByTitle[input.title as keyof typeof aiChatPromptsByTitle] ?? buildFallbackAiChatPrompt(input),
    aiDraw: {
      dimensions,
      prompt: [
        `AI Draw 逆向工程《${input.title}》海报，只提取用户选择的维度，不默认套用整张海报。`,
        ...dimensionLines,
        "事件维度固定留空，由用户自填。"
      ].join("\n")
    }
  };
}

export const posterPromptPresets = {
  inception: createPreset({
    title: "Inception",
    chatFocus: "城市折叠的超现实空间、梦境层级、冷峻商业大片质感、人物被巨大城市结构压住的悬疑感。",
    chatVisual: "硬朗写实摄影，冷蓝灰城市光，透视线强，画面像一张高概念科幻惊悚片主海报。",
    dimensions: {
      atmosphere: "悬疑",
      characterPosition: "中间",
      composition: "对角线构图",
      era: "当代",
      scene: "城市",
      shotScale: "中景",
      style: "超现实",
      tone: "冷蓝"
    }
  }),
  "the-matrix": createPreset({
    title: "The Matrix",
    chatFocus: "黑色长风衣、代码雨、赛博都市、救世主式中心人物和高反差科幻动作氛围。",
    chatVisual: "深黑背景配冷绿色数字光，人物姿态锐利，空间带有虚拟系统和地下反抗组织的压迫感。",
    dimensions: {
      atmosphere: "压迫",
      characterPosition: "中间",
      composition: "中心对称构图",
      era: "未来",
      scene: "城市",
      shotScale: "中景",
      style: "赛博",
      tone: "冷调"
    }
  }),
  parasite: createPreset({
    title: "Parasite",
    chatFocus: "家庭群像、阶级空间、豪宅草坪、遮挡眼睛的冷幽默和不安的社会寓言感。",
    chatVisual: "写实光线，平静构图里藏危险，人物像被摆放在建筑和阶层秩序中。",
    dimensions: {
      atmosphere: "压抑",
      characterPosition: "中间",
      composition: "上下分割构图",
      era: "当代",
      scene: "公寓",
      shotScale: "全景",
      style: "写实",
      tone: "冷调"
    }
  }),
  "spirited-away": createPreset({
    title: "Spirited Away",
    chatFocus: "少女、异世界浴场、神怪符号、温暖灯火和成长童话里的神秘冒险感。",
    chatVisual: "手绘动画质感，暖色灯笼与夜色对比，场景细节繁密但主角入口清楚。",
    dimensions: {
      atmosphere: "神秘",
      characterPosition: "中间",
      composition: "满版型构图",
      era: "千禧",
      scene: "宫廷",
      shotScale: "全景",
      style: "动漫",
      tone: "暖调"
    }
  }),
  "the-godfather": createPreset({
    title: "The Godfather",
    chatFocus: "黑暗权力肖像、家族犯罪史诗、低调光、严肃脸部特写和经典黑帮片庄重感。",
    chatVisual: "几乎全黑背景，脸部被少量顶光切出，海报信息克制，权力感从留白和阴影里出来。",
    dimensions: {
      atmosphere: "肃穆",
      characterPosition: "中间",
      composition: "特写面部构图",
      era: "现代",
      scene: "公寓",
      shotScale: "近景",
      style: "写实",
      tone: "暗调"
    }
  }),
  "pulp-fiction": createPreset({
    title: "Pulp Fiction",
    chatFocus: "廉价小说封面、复古犯罪气质、挑衅人物姿态、烟草道具和九十年代独立电影酷感。",
    chatVisual: "胶片颗粒明显，暖黄旧纸色，人物像被放在一本旧杂志封面上，带一点危险和黑色幽默。",
    dimensions: {
      atmosphere: "诡异",
      characterPosition: "中间",
      composition: "三分法构图",
      era: "九十年代",
      scene: "公寓",
      shotScale: "中景",
      style: "胶片",
      tone: "暖黄"
    }
  }),
  "the-dark-knight": createPreset({
    title: "The Dark Knight",
    chatFocus: "超级英雄孤身站在城市废墟前、燃烧符号、犯罪史诗、冷峻夜景和高压对抗感。",
    chatVisual: "冷蓝城市夜色，火光作为高亮，人物居中像道德困境里的剪影，商业大片完成度高。",
    dimensions: {
      atmosphere: "压迫",
      characterPosition: "中间",
      composition: "中心对称构图",
      era: "当代",
      scene: "城市",
      shotScale: "中景",
      style: "写实",
      tone: "冷蓝"
    }
  }),
  "la-la-land": createPreset({
    title: "La La Land",
    chatFocus: "双人舞蹈剪影、洛杉矶夜景、音乐爱情片的浪漫色彩和经典歌舞片姿态。",
    chatVisual: "蓝紫夜色配暖黄灯光，人物动作舒展，城市天际线带舞台感，整体轻盈明亮。",
    dimensions: {
      atmosphere: "浪漫",
      characterPosition: "中间",
      composition: "对角线构图",
      era: "当代",
      scene: "城市",
      shotScale: "全景",
      style: "写实",
      tone: "蓝调"
    }
  }),
  "mad-max-fury-road": createPreset({
    title: "Mad Max: Fury Road",
    chatFocus: "末日车队、沙漠风暴、橙蓝强对比、狂暴动作和荒漠工业美学。",
    chatVisual: "高饱和暖橙沙尘压满画面，金属机械和人物姿态强硬，速度感和危险感非常高。",
    dimensions: {
      atmosphere: "热血",
      characterPosition: "中间",
      composition: "满版型构图",
      era: "未来",
      scene: "沙漠",
      shotScale: "中景",
      style: "写实",
      tone: "青橙"
    }
  }),
  arrival: createPreset({
    title: "Arrival",
    chatFocus: "巨大椭圆飞行物、雾气草原、小人物尺度、极简科幻和未知文明的压迫静默。",
    chatVisual: "低饱和冷灰蓝，巨物垂直立在地平线上，留白多，人物和交通工具被环境压小。",
    dimensions: {
      atmosphere: "压迫",
      characterPosition: "下方",
      composition: "左右分割构图",
      era: "未来",
      scene: "草原",
      shotScale: "中景",
      style: "超现实",
      tone: "青橙"
    }
  }),
  "blade-runner-2049": createPreset({
    title: "Blade Runner 2049",
    chatFocus: "近未来孤独人物、霓虹城市、橙色荒原、人工智能疑云和赛博黑色电影质感。",
    chatVisual: "冷蓝与暖橙互相撕开空间，人物被巨大环境包围，雨夜和尘雾都有硬质光源。",
    dimensions: {
      atmosphere: "孤寂",
      characterPosition: "右侧",
      composition: "左右分割构图",
      era: "未来",
      scene: "城市",
      shotScale: "中景",
      style: "赛博",
      tone: "青橙"
    }
  }),
  interstellar: createPreset({
    title: "Interstellar",
    chatFocus: "宇航员、宇宙尺度、孤独探索、硬科幻史诗和人类面对未知边界的情绪。",
    chatVisual: "冷蓝太空光，人物在巨大空间中显得很小，地平线或星体制造庄严的留白。",
    dimensions: {
      atmosphere: "史诗",
      characterPosition: "中间",
      composition: "留白型构图",
      era: "未来",
      scene: "太空",
      shotScale: "远景",
      style: "写实",
      tone: "冷蓝"
    }
  }),
  "everything-everywhere-all-at-once": createPreset({
    title: "Everything Everywhere All at Once",
    chatFocus: "多元宇宙拼贴、家庭动作喜剧、符号爆炸、荒诞能量和高密度群像海报。",
    chatVisual: "高饱和、多元素、旋涡式层次，人物和道具像被卷入同一场宇宙级混乱。",
    dimensions: {
      atmosphere: "搞笑",
      characterPosition: "中间",
      composition: "满版型构图",
      era: "当代",
      scene: "城市",
      shotScale: "中景",
      style: "超现实",
      tone: "高饱和"
    }
  }),
  dune: createPreset({
    title: "Dune",
    chatFocus: "沙漠星球、预言式人物群像、巨大沙丘、低饱和史诗感和命运压力。",
    chatVisual: "暖黄沙尘覆盖画面，人物庄重居中，环境尺度大，像一张严肃太空史诗主视觉。",
    dimensions: {
      atmosphere: "史诗",
      characterPosition: "中间",
      composition: "中心对称构图",
      era: "未来",
      scene: "沙漠",
      shotScale: "中近景",
      style: "写实",
      tone: "暖黄"
    }
  }),
  "dune-part-two": createPreset({
    title: "Dune: Part Two",
    chatFocus: "沙漠战争、人物阵营对峙、橙色尘暴、宗教史诗感和压迫性的英雄命运。",
    chatVisual: "高密度沙尘和硬光，人物更强势，前景武器与远景军队共同制造大战临近感。",
    dimensions: {
      atmosphere: "压迫",
      characterPosition: "中间",
      composition: "满版型构图",
      era: "未来",
      scene: "沙漠",
      shotScale: "中景",
      style: "写实",
      tone: "暖黄"
    }
  }),
  "the-grand-budapest-hotel": createPreset({
    title: "The Grand Budapest Hotel",
    chatFocus: "粉色酒店立面、正面对称、精致复古喜剧、微缩景观和童话般的欧洲旧世界。",
    chatVisual: "严格中心对称，莫兰迪粉紫色，建筑像舞台布景，人物和标题都极度规整。",
    dimensions: {
      atmosphere: "搞笑",
      characterPosition: "中间",
      composition: "中心对称构图",
      era: "昭和",
      scene: "宫廷",
      shotScale: "全景",
      style: "极简",
      tone: "莫兰迪"
    }
  }),
  her: createPreset({
    title: "Her",
    chatFocus: "孤独男性近景、红色背景、柔软未来生活、亲密科技关系和安静情绪。",
    chatVisual: "大面积红色或暖色纯背景，脸部细腻，构图极简，情绪比事件更重要。",
    dimensions: {
      atmosphere: "孤寂",
      characterPosition: "中间",
      composition: "特写面部构图",
      era: "未来",
      scene: "公寓",
      shotScale: "近景",
      style: "写实",
      tone: "红黑"
    }
  }),
  "get-out": createPreset({
    title: "Get Out",
    chatFocus: "惊恐面部、黑暗空间、心理恐怖、被困住的凝视和社会寓言式不安。",
    chatVisual: "高反差暗调，人物表情被近景放大，背景压黑，眼神和泪光成为主视觉。",
    dimensions: {
      atmosphere: "悬疑",
      characterPosition: "中间",
      composition: "特写面部构图",
      era: "当代",
      scene: "公寓",
      shotScale: "近景",
      style: "写实",
      tone: "暗调"
    }
  }),
  "black-swan": createPreset({
    title: "Black Swan",
    chatFocus: "芭蕾舞者面部、黑白羽毛意象、心理分裂、优雅和恐怖并存的舞台感。",
    chatVisual: "黑白红极简配色，脸部居中，眼妆和裂纹像符号，整体干净但非常危险。",
    dimensions: {
      atmosphere: "诡异",
      characterPosition: "中间",
      composition: "特写面部构图",
      era: "当代",
      scene: "宫廷",
      shotScale: "特写",
      style: "写实",
      tone: "黑白"
    }
  }),
  moonlight: createPreset({
    title: "Moonlight",
    chatFocus: "蓝色面部拼贴、成长阶段、亲密凝视、静默创伤和诗意现实主义。",
    chatVisual: "蓝紫色低照度，脸部被切成阶段感，画面安静，情绪克制但很深。",
    dimensions: {
      atmosphere: "孤寂",
      characterPosition: "中间",
      composition: "特写面部构图",
      era: "当代",
      scene: "城市",
      shotScale: "近景",
      style: "写实",
      tone: "蓝调"
    }
  }),
  whiplash: createPreset({
    title: "Whiplash",
    chatFocus: "爵士鼓手、舞台聚光、红黄暖光、师徒压力和音乐训练的爆裂张力。",
    chatVisual: "强聚光从黑场里切出人物，乐器细节清晰，构图留白但压力集中。",
    dimensions: {
      atmosphere: "压迫",
      characterPosition: "中间",
      composition: "留白型构图",
      era: "当代",
      scene: "校园",
      shotScale: "中景",
      style: "写实",
      tone: "暖黄"
    }
  }),
  "the-social-network": createPreset({
    title: "The Social Network",
    chatFocus: "冷静人物脸部、数字时代孤独、法律与创业压力、玻璃感和低饱和蓝灰。",
    chatVisual: "近景脸部被文字或界面感覆盖，背景冷暗，整体像一张精英世界的审判海报。",
    dimensions: {
      atmosphere: "孤寂",
      characterPosition: "中间",
      composition: "特写面部构图",
      era: "当代",
      scene: "校园",
      shotScale: "近景",
      style: "写实",
      tone: "冷蓝"
    }
  }),
  "no-country-for-old-men": createPreset({
    title: "No Country for Old Men",
    chatFocus: "西部荒原、追猎者和逃亡者、褪色暖光、犯罪惊悚和宿命压迫。",
    chatVisual: "粗粝胶片颗粒，暖黄褪色，人物与空旷地平线形成危险距离。",
    dimensions: {
      atmosphere: "压迫",
      characterPosition: "左侧",
      composition: "留白型构图",
      era: "西部",
      scene: "沙漠",
      shotScale: "中景",
      style: "写实",
      tone: "暖黄褪色"
    }
  }),
  "the-shape-of-water": createPreset({
    title: "The Shape of Water",
    chatFocus: "水下拥抱、人鱼童话、冷战实验室、复古浪漫和绿色蓝色液体光。",
    chatVisual: "水波和漂浮感明显，青绿冷光包裹人物，浪漫但带一点秘密和危险。",
    dimensions: {
      atmosphere: "浪漫",
      characterPosition: "中间",
      composition: "中心对称构图",
      era: "冷战",
      scene: "深海",
      shotScale: "中景",
      style: "超现实",
      tone: "森系"
    }
  }),
  "pans-labyrinth": createPreset({
    title: "Pan's Labyrinth",
    chatFocus: "女孩、迷宫、怪物童话、战争阴影和黑暗寓言式奇幻。",
    chatVisual: "森林和石质迷宫压暗，暖冷交错，主角像走进一扇危险的童话门。",
    dimensions: {
      atmosphere: "神秘",
      characterPosition: "中间",
      composition: "框架式构图",
      era: "冷战",
      scene: "森林",
      shotScale: "中景",
      style: "超现实",
      tone: "暗调"
    }
  }),
  amelie: createPreset({
    title: "Amelie",
    chatFocus: "巴黎少女近景、红绿复古色、奇想爱情、温暖笑容和法式童话日常。",
    chatVisual: "暖黄与绿色互补，脸部明亮居中，背景像小镇街角或复古公寓，轻盈又古灵精怪。",
    dimensions: {
      atmosphere: "温馨",
      characterPosition: "中间",
      composition: "中心对称构图",
      era: "现代",
      scene: "城市",
      shotScale: "近景",
      style: "胶片",
      tone: "暖黄"
    }
  }),
  "crouching-tiger-hidden-dragon": createPreset({
    title: "Crouching Tiger, Hidden Dragon",
    chatFocus: "竹林武侠、飞檐动作、东方山水、压抑爱情和飘逸剑术。",
    chatVisual: "冷绿竹林和水墨式留白，人物动作轻盈，画面有古典武侠的诗意和速度。",
    dimensions: {
      atmosphere: "自由",
      characterPosition: "中间",
      composition: "对角线构图",
      era: "武侠",
      scene: "森林",
      shotScale: "全景",
      style: "水墨",
      tone: "森系"
    }
  }),
  "the-fellowship-of-the-ring": createPreset({
    title: "The Lord of the Rings: The Fellowship of the Ring",
    chatFocus: "中土远征群像、魔戒符号、史诗冒险、古老森林和命运召唤感。",
    chatVisual: "暖冷交替的奇幻光，人物群像层级清楚，远山和森林构成史诗尺度。",
    dimensions: {
      atmosphere: "史诗",
      characterPosition: "中间",
      composition: "满版型构图",
      era: "中世纪",
      scene: "森林",
      shotScale: "中景",
      style: "写实",
      tone: "暖调"
    }
  }),
  "the-silence-of-the-lambs": createPreset({
    title: "The Silence of the Lambs",
    chatFocus: "女性脸部特写、死亡飞蛾、心理犯罪、静默恐惧和九十年代惊悚质感。",
    chatVisual: "脸部极近，背景苍白或压暗，嘴部符号制造不适，构图干净但非常阴森。",
    dimensions: {
      atmosphere: "阴森",
      characterPosition: "中间",
      composition: "特写面部构图",
      era: "九十年代",
      scene: "警局",
      shotScale: "特写",
      style: "写实",
      tone: "暗调"
    }
  }),
  "fight-club": createPreset({
    title: "Fight Club",
    chatFocus: "地下叛逆、脏粉色肥皂、双人物关系、都市失控和九十年代反消费心理惊悚。",
    chatVisual: "胶片质感粗糙，粉红和黑色形成危险反差，人物像被广告灯箱和地下室阴影同时照亮。",
    dimensions: {
      atmosphere: "诡异",
      characterPosition: "中间",
      composition: "中心对称构图",
      era: "九十年代",
      scene: "城市",
      shotScale: "中近景",
      style: "胶片",
      tone: "红黑"
    }
  })
} satisfies Record<string, PosterPromptPresets>;

export function getPosterPromptPreset(id: string) {
  const baseId = id.replace(/-variant-\d+$/, "");
  const presets: Record<string, PosterPromptPresets> = posterPromptPresets;
  return presets[baseId];
}
