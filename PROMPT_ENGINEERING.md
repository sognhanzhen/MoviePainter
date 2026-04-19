# MoviePainter Prompt Engineering

This note captures the current `/office-hours` prompt split for `AI Chat` and `AI Draw`.

## Office-Hours Framing

### User Jobs

- `AI Chat`: the user wants automatic poster generation and uses a reference poster for its overall cinematic taste, poster craft, lighting, texture, and genre mood.
- `AI Draw`: the user wants to extract one or more controlled dimensions from a reference poster, then decide which dimensions enter the generation process.

### Non-Goals

- `AI Chat` should not become a rigid parameter extractor.
- `AI Draw` should not silently copy the full poster when the user selects only one or two dimensions.
- The `事件` dimension is user-defined and should not be inferred from the reference poster.

## AI Chat Generation Prompt

Use this when the mode is `AI Chat`.

```text
Create one finished cinematic movie poster image for direct display in a web application.
AI Chat mode: the reference poster is a broad style compass.
Use the reference for overall movie-poster taste, cinematic texture, lighting logic, genre feeling, and production value.
Do not copy the reference poster's exact characters, title design, layout, or scene one-to-one.
Do not return explanations. The image should be polished, poster-like, and visually readable.
Avoid random unreadable typography; if text appears, keep it subtle and poster-appropriate.

Model route: {{modelLabel}}
Mode: AI Chat
Aspect ratio: {{aspectRatio}}
Final canvas must be {{aspectRatio}}; do not return a square image unless the aspect ratio is 1:1.
User prompt: {{userPrompt}}

Reference title: {{posterTitle}}
Reference genre: {{posterGenre}}
Reference summary: {{posterSummary}}
Reference description: {{posterDescription}}
Reference overall character language: {{posterCharacter}}
Reference overall style: {{posterStyle}}
Reference overall atmosphere: {{posterAtmosphere}}
Reference overall color tone: {{posterTone}}
Reference overall composition: {{posterComposition}}
```

## AI Draw Poster Analysis Prompt

Use this before generation when a user chooses a reference poster for `AI Draw`. The model should analyze the poster image and return defaults for the selectable dimensions.

```text
你是电影海报视觉分析模型。请只根据输入海报画面，解析 AI Draw 的默认维度。

规则：
1. 只输出 JSON，不要解释。
2. 必须返回 9 个维度。
3. “事件”是用户自定义维度，不要从海报推断，固定返回空字符串。
4. 其他 8 个维度必须优先从候选项中选择最贴近的一项。
5. 如果画面证据不足，选择最接近的候选项，并把 confidence 降低。
6. 不要识别或复刻真实演员身份，只描述视觉属性。

候选项：
- 人物景别：大远景、远景、全景、中全景、中景、中近景、近景、特写
- 人物位置：左侧、右侧、上方、下方、中间
- 年代：现代、古代、民国、当代、八十年代、九十年代、千禧、未来、中世纪、罗马、战国、盛唐、武侠、仙侠、西部、工业、冷战、昭和、史前
- 场景：城市、校园、医院、警局、法庭、太空、深海、沙漠、森林、雪地、战场、废墟、宫廷、江湖、公路、列车、岛屿、小镇、公寓、草原、土房子
- 风格：写实、极简、胶片、赛博、水墨、手绘、油画、素描、动漫、港风、超现实
- 氛围：温馨、孤寂、悬疑、热血、史诗、浪漫、压抑、神秘、搞笑、怀旧、宁静、压迫、诡异、清新、肃穆、奢靡、自由、阴森、青春、禅意
- 色调：青橙、黑白、日系、暖黄、冷蓝、黑金、森系、霓虹、蓝调、暖调、冷调、暗调、红黑、高饱和、莫兰迪、暖黄褪色
- 构图：中心对称构图、三分法构图、对角线构图、框架式构图、引导线构图、满版型构图、留白型构图、上下分割构图、左右分割构图、特写面部构图、俯视构图、仰视构图、剪影构图、倾斜构图、倒影构图

JSON schema:
{
  "人物景别": {"value": "中景", "confidence": 0.0, "evidence": "short visual evidence"},
  "人物位置": {"value": "右侧", "confidence": 0.0, "evidence": "short visual evidence"},
  "事件": {"value": "", "confidence": 1.0, "evidence": "用户自定义，不从海报解析"},
  "年代": {"value": "未来", "confidence": 0.0, "evidence": "short visual evidence"},
  "场景": {"value": "草原", "confidence": 0.0, "evidence": "short visual evidence"},
  "风格": {"value": "超现实", "confidence": 0.0, "evidence": "short visual evidence"},
  "氛围": {"value": "压迫", "confidence": 0.0, "evidence": "short visual evidence"},
  "色调": {"value": "青橙", "confidence": 0.0, "evidence": "short visual evidence"},
  "构图": {"value": "左右分割构图", "confidence": 0.0, "evidence": "short visual evidence"}
}
```

## AI Draw Generation Prompt

Use this when the mode is `AI Draw`.

```text
Create one finished cinematic movie poster image for direct display in a web application.
AI Draw mode: only apply the poster dimensions explicitly selected by the user.
Do not transfer unselected reference-poster dimensions. Do not silently copy the whole poster style.
The Event dimension is user-defined; never invent an event from the reference poster when the user leaves Event empty.
Do not return explanations. The image should be polished, poster-like, and visually readable.
Avoid random unreadable typography; if text appears, keep it subtle and poster-appropriate.

Model route: {{modelLabel}}
Mode: AI Draw
Aspect ratio: {{aspectRatio}}
Final canvas must be {{aspectRatio}}; do not return a square image unless the aspect ratio is 1:1.

Authoritative AI Draw package:
请基于参考海报《{{posterTitle}}》生成一张新的电影海报。
AI Draw 只应用用户明确选择的维度；未列出的维度不要从参考海报迁移。
事件为用户自定义维度，如果未列出事件，不要自行补写事件。
已选择维度：
- {{dimensionLabel}}: {{dimensionValue}}（权重 {{weight}}%）

Reference title: {{posterTitle}}
Selected dimensions: {{selectedDimensionLabels}}
Module weights: {{dimensionWeights}}
```

## Preset Storage Contract

The current 30 curated posters preload prompts in code:

- Client: `client/src/data/poster-prompt-presets.ts`
- Server: `server/src/data/poster-prompt-presets.ts`

Each poster exposes:

- `promptPresets.aiChat`: the reverse-engineered general prompt that fills the AI Chat input.
- `promptPresets.aiDraw.prompt`: the professional analysis prompt for the poster.
- `promptPresets.aiDraw.dimensions`: the nine AI Draw dimensions.

`事件` is always an empty string in `dimensions`; it is filled only by the user. The other eight dimensions are shown as poster-derived options in the AI Draw dimension buttons, and they enter generation only after the user selects them.
