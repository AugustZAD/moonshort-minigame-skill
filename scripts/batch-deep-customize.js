#!/usr/bin/env node
/**
 * Batch Deep Customization Script
 * Reads V3 templates + episode data → generates customized game/index.html per episode
 * Following SKILL.md Steps 1-4 (template selection, asset prep, CTX injection)
 */

const fs = require('fs');
const path = require('path');

const PACKS = 'D:/nick/MobAI/minigame-remix/packs/attribute-archetypes/games';
const DATA = 'D:/nick/MobAI/minigame-remix/data/狼人';

// ═══════════════════════════════════════════════════════════════════════════════
//  EPISODE CONFIGURATIONS — Step 1d verified: no consecutive same template
// ═══════════════════════════════════════════════════════════════════════════════

const EPISODES = [
  // EP1 - already customized correctly, skip
  {
    ep: 'ep2', template: 'will-surge', attribute: '意志',
    label: 'EP 2', title: '工具',
    theme: 'dark',
    bg: '银月领地 豪宅 客厅.png',
    chars: ['Sylvia', 'James'],
    portraits: { left: 'Sylvia.png', right: 'James.png' },
    narrative: [
      { speaker: 'Sylvia', text: '一张纸，一句话，一个名字——\n我才明白自己从来都是工具。' },
      { speaker: '', text: 'Luna Miller的安排从一开始就写好了。\n而我只是那枚被移动的棋子。' },
      { speaker: 'Sylvia', text: '被利用的真相压下来了。\n撑住。不要在这里倒下。' }
    ],
    resultTexts: {
      S: '你和Daisy在那一刻成为了同盟。\n那些话被说出来，被记住，再也不能被收回。',
      A: '你开了口，声音颤抖，但Daisy听见了。\n那足够了。',
      B: '你沉默地低下头，心里的火焰在消退。\n被利用的感觉压得你喘不上气来。',
      C: '你什么都没说，什么都没做。\n走廊里只有壁炉的低鸣和你逐渐碎裂的意志。'
    }
  },
  {
    ep: 'ep3', template: 'conveyor-sort', attribute: '智慧',
    label: 'EP 3', title: '替代品',
    theme: 'mystery',
    bg: '银月领地 豪宅 走廊.png',
    chars: ['Sylvia', 'Daisy'],
    portraits: { left: 'Sylvia.png', right: 'Daisy.png' },
    narrative: [
      { speaker: 'Sylvia', text: '门缝里的光窄得像一把刀。\nLuna Miller在里面谈论我——我的身体，我的孩子。' },
      { speaker: '', text: '每一句话都是碎片。\n我必须在它们消失之前，把它们分类、记住。' },
      { speaker: 'Sylvia', text: '整理线索。分辨真假。\n在她发现我之前，把一切都记下来。' }
    ],
    resultTexts: {
      S: '你推开了门，用沉默宣布了你的存在。\nLuna Miller的表情证实了一切。',
      A: '你的手指碰到了门板，但最终没有推下去。\n你继续听，继续记住每一句话。',
      B: '你没有推门，也没有离开。\n站在走廊里，用被动的存在向Luna Miller宣战。',
      C: '你转身走回了厨房，好像什么都没有听见。\n但那些话已经深入了你的骨髓。'
    }
  },
  {
    ep: 'ep4', template: 'spotlight-seek', attribute: '魅力',
    label: 'EP 4', title: '打量',
    theme: 'combat',
    bg: '银月领地 豪宅 Luna书房.png',
    chars: ['Sylvia', 'Cynthia'],
    portraits: { left: 'Sylvia.png', right: 'Cynthia.png' },
    narrative: [
      { speaker: '', text: 'Cynthia走出书房时，她的眼睛\n从我的脸扫到我隆起的腹部，停留了三秒。' },
      { speaker: 'Sylvia', text: '那一刻，我感受到了来自长老议会的无声评判。\n我不是伴侣，我是工具。' },
      { speaker: 'Sylvia', text: '找到她的视线。锁住它。\n让她知道我看见了一切。' }
    ],
    resultTexts: {
      S: '你走进了那间书房，坐在圆桌边。\n她的眼神变了——你不再是被摆布的棋子。',
      A: '你和Cynthia对视，没有退缩。\n那三秒的沉默是你能做出的最大的反抗。',
      B: '你留在走廊里，用被动的听觉来获取信息。\n但Cynthia已经看出了你的犹豫。',
      C: '你低下了头，转身离开了。\nCynthia的那个摇头，否定了你的一切。'
    }
  },
  {
    ep: 'ep5', template: 'will-surge', attribute: '意志',
    label: 'EP 5', title: '撑不住',
    theme: 'dark',
    bg: '银月领地 治疗师小屋.png',
    chars: ['Sylvia', 'Elara Vance'],
    portraits: { left: 'Sylvia.png', right: 'Elara Vance.png' },
    narrative: [
      { speaker: 'Sylvia', text: '我坐在诊床上，手里攥着一张纸。\n上面是我的死期——一个月圆。' },
      { speaker: '', text: 'Elara说如果这条Bond不被解决，\n我就会死。整个世界在旋转。' },
      { speaker: 'Sylvia', text: '撑住。不管怎样，先活下去。\n然后再想怎么反击。' }
    ],
    resultTexts: {
      S: '你直视着Elara，问出了所有的问题。\n你知道了怎样才能活下去，知道了代价是什么。',
      A: '你开口问了，声音在颤抖。\nElara给了你答案，但你没有力气去接受它。',
      B: '你什么都没问，什么都没说。\n那张纸在你手里，而你选择了遗忘。',
      C: '你的身体坍塌了，你的意志也随之瓦解。\n死亡现在有了一个具体的日期。'
    }
  },
  {
    ep: 'ep6', template: 'red-light-green-light', attribute: '意志',
    label: 'EP 6', title: '棋子',
    theme: 'mystery',
    bg: '银月领地 豪宅 Luna书房.png',
    chars: ['Sylvia', 'Luna Miller'],
    portraits: { left: 'Sylvia.png', right: 'Luna Miller.png' },
    narrative: [
      { speaker: '', text: 'Luna的话像一把利刃——\n我从来就不是他的伴侣，只是一个解决方案。' },
      { speaker: 'Sylvia', text: '我是一枚棋子。一个恰好在\n对的时间出现的工具。' },
      { speaker: 'Sylvia', text: '该沉默时沉默。该开口时开口。\n控制节奏，不要暴露情绪。' }
    ],
    resultTexts: {
      S: '你站直身体走出了书房。\n你记住了每一个字——不是因为要原谅，而是因为要行动。',
      A: '你强忍着重复了她的话，声音比预想的脆弱。\n但你没有哭。',
      B: '你沉默地走出书房，那张折皱的纸被你死死攥在手里。\n在门外的走廊里，整个身体开始颤抖。',
      C: '你没有说话就离开了，甚至没有看她一眼。\n把所有的愤怒咽回肚子里，像吞下一颗毒药。'
    }
  },
  {
    ep: 'ep7', template: 'qte-hold-release', attribute: '意志',
    label: 'EP 7', title: '嫉妒',
    theme: 'dark',
    bg: '银月领地 豪宅 主卧.png',
    chars: ['Sylvia', 'James'],
    portraits: { left: 'Sylvia.png', right: 'James.png' },
    narrative: [
      { speaker: '', text: 'James进来了，Kennedy的气息随他飘进房间。\n我皮肤下有什么东西在翻腾。' },
      { speaker: 'Sylvia', text: '狼纹浮现。内狼在苏醒。\n我咬紧牙关，把那条兽性压回去。' },
      { speaker: 'Sylvia', text: '压住。不要暴走。\n在正确的时机释放。' }
    ],
    resultTexts: {
      S: '你把窗户关上，把自己关进黑暗里。\n半夜你睁着眼睛坐在地板上，但记忆在闪闪发光。',
      A: '你走到窗边坐下，拼命把每一句话都记在脑子里。\n指节泛白，但你撑住了。',
      B: '你坐在椅子上，背脊挺直。\n呼吸很平稳，像在等一件早就被你算好了的事情。',
      C: '窗户关上的一刻，你的世界也塌了下来。\n你蜷缩在黑暗里，什么都感觉不到。'
    }
  },
  {
    ep: 'ep8', template: 'stardew-fishing', attribute: '魅力',
    label: 'EP 8', title: '没有否认',
    theme: 'combat',
    bg: '银月领地 豪宅 主卧.png',
    chars: ['Sylvia', 'James'],
    portraits: { left: 'Sylvia.png', right: 'James.png' },
    narrative: [
      { speaker: 'Sylvia', text: '我把六周的沉默一股脑倒出来：\n去新月领地三次、集会上的气味、Elara的诊断。' },
      { speaker: '', text: '他没有否认一个字，甚至没有为自己辩解。\n那种沉默比任何谎言都更加刺痛。' },
      { speaker: 'Sylvia', text: '拉扯。试探。掌控节奏。\n让他先开口——然后记住他说的每一个字。' }
    ],
    resultTexts: {
      S: '你转过身走到椅子上坐下，不再看他。\n你们之间隔着整个世界的距离，而你已经做好了准备。',
      A: '话出了口，声音在第一个字之后就断了。\n眼眶发红但眼泪没有落下来。',
      B: '你强行说出了那些话，虽然声音颤抖，但他听见了。\n你的痛苦依然无人诉说。',
      C: '你清楚地说出了每一个字，没有颤抖，没有眼泪。\n他摊开了所有的牌，而你拿着赢的理由。'
    }
  },
  {
    ep: 'ep9', template: 'cannon-aim', attribute: '身手',
    label: 'EP 9', title: '给我',
    theme: 'dark',
    bg: '银月领地 治疗师小屋.png',
    chars: ['Sylvia', 'Elara Vance'],
    portraits: { left: 'Sylvia.png', right: 'Elara Vance.png' },
    narrative: [
      { speaker: 'Sylvia', text: '我走进治疗师小屋，手里什么都没拿。\n我的决定已经成型。' },
      { speaker: '', text: 'Elara看着我。暗格里的东西等了很久。\n而我现在要去拿它。' },
      { speaker: 'Sylvia', text: '瞄准。精确地说出那两个字。\n不犹豫，不后退。' }
    ],
    resultTexts: {
      S: '你没有开口，只是看着烛火。\nElara打开暗格，布包落到桌面上——你的人生就此分成了两半。',
      A: '你声音很轻地说出了那两个字。\nElara静静地看了你两秒才动作。',
      B: '"给我。"声音平稳地从喉咙里出来。\nElara看着你，然后打开了柜子。',
      C: '你不开口，不动作，只是等。\nElara理解了什么，她蹲下来，取出布包放到桌面上。'
    }
  },
  {
    ep: 'ep10', template: 'qte-boss-parry', attribute: '身手',
    label: 'EP 10', title: '熄灭',
    theme: 'combat',
    bg: '银月领地 豪宅 主卧.png',
    chars: ['Sylvia', 'James'],
    portraits: { left: 'Sylvia.png', right: 'James.png' },
    narrative: [
      { speaker: '', text: '黎明前的黑暗里，草药的苦味还压在舌根。\n腹中的温热正在悄然消失。' },
      { speaker: 'Sylvia', text: 'James的怒吼响彻整个豪宅。\n他冲进来时，我已经站了起来。' },
      { speaker: 'Sylvia', text: '冷静得像一块石头。\n他的Alpha命令砸过来——挡住它。' }
    ],
    resultTexts: {
      S: '"明天，在所有长老面前，我会说出这些话。做好准备吧。"\n沉默压下来，而你的背脊始终是直的。',
      A: '你张开嘴试着说出来，但声音在第一个字之后就断了。\n但你还是强行把话说完。',
      B: '你直视着他，一字一顿地说出了誓词的前半部分。\n他的手猛地收回来，眼睛里有什么东西裂开了。',
      C: '完整的誓词从你嘴里出来，声音清晰、坚定。\n他后退了半步——你已经赢了。'
    }
  },
  {
    ep: 'ep11', template: 'lane-dash', attribute: '身手',
    label: 'EP 11', title: '撤不回',
    theme: 'combat',
    bg: '银月领地 豪宅 议事厅.png',
    chars: ['Sylvia', 'James'],
    portraits: { left: 'Sylvia.png', right: 'James.png' },
    narrative: [
      { speaker: 'Sylvia', text: '我当众宣读了拒绝誓词。\n石材大厅在一瞬间死寂了。' },
      { speaker: '', text: 'James从主位上猛地站起来。\nAlpha命令砸下来，我的膝盖失控弯折。' },
      { speaker: 'Sylvia', text: '爬起来。站直。冲过去。\n三天内议会要裁定——现在，跑！' }
    ],
    resultTexts: {
      S: '你没有移动，没有屈服。\n议会的目光现在落在了James身上，那三天的倒计时是你争取来的。',
      A: '你利用规程的力量，用他自己的规则把他钉在了原地。\nKennedy在门口的惊愕是你胜利的见证。',
      B: '你鼓起了勇气，但话语在最关键的时刻断了。\n他的反驳比你的知识更有力量。',
      C: '身体在Alpha命令的余震下崩溃了。\n你倒下的那一刻，他准备好接住你——用他的方式。'
    }
  },
  {
    ep: 'ep12', template: 'maze-escape', attribute: '智慧',
    label: 'EP 12', title: '等你了',
    theme: 'mystery',
    bg: '银月领地 豪宅 主卧.png',
    chars: ['Sylvia', 'Daisy'],
    portraits: { left: 'Sylvia.png', right: 'Daisy.png' },
    narrative: [
      { speaker: '', text: '高烧压着我每一根骨头。\n我被锁在这间卧室里，窗帘拉合，门从外面上锁。' },
      { speaker: 'Sylvia', text: '三天的监禁，或者永远——\n他没有说清楚。但Daisy敲了敲窗。' },
      { speaker: 'Sylvia', text: '找到路线。穿过走廊。\n在他发现之前，逃出这座豪宅。' }
    ],
    resultTexts: {
      S: '你自己站起来，自己走出了那扇窗。\n你的每一步都不再属于任何人的命令。',
      A: '你握住了Daisy的手，让她帮你承担一瞬间的重量。\n被帮助不是失败。',
      B: '你试图自己撑起全部，身体背叛了意志。\n但你没有放弃——踉跄中前行。',
      C: '身体在高烧和拒绝状态的双重撕裂下彻底失控。\n最后是他的手把你扶起来。'
    }
  },
  {
    ep: 'ep12_minor', template: 'parking-rush', attribute: '智慧',
    label: 'EP 12', title: '坐着别动',
    theme: 'combat',
    bg: '银月领地 豪宅 议事厅.png',
    chars: ['Sylvia', 'Cynthia'],
    portraits: { left: 'Sylvia.png', right: 'Cynthia.png' },
    narrative: [
      { speaker: '', text: 'Kennedy走进议事厅，看见我还坐在席位上。\n她的脚步停了——脸上的从容裂开了一道缝。' },
      { speaker: 'Sylvia', text: '高烧还在烧，手指已经把扶手攥出了温度。\n但我坐着。' },
      { speaker: 'Sylvia', text: '调度每一步。移开障碍。\n在规则里找到突破口。' }
    ],
    resultTexts: {
      S: '你没有逃离，没有示弱，在所有人面前坐到最后。\nKennedy的冰裂，James的无言，都钉死在了长老们的记录里。',
      A: '你选择了尊严的退场，让所有的胜利都被看见。\nCynthia提前休会，你独自走出议事厅。',
      B: '你撑到了极限，身体在消耗，但没有倒下。\nCynthia看见了你的代价。',
      C: '高烧击垮了你的意志，你选择了放弃。\n让他带走你，让他赢，让这一切结束。'
    }
  },
  {
    ep: 'ep13', template: 'conveyor-sort', attribute: '智慧',
    label: 'EP 13', title: '走进去',
    theme: 'nature',
    bg: '银月领地 东部边界.png',
    chars: ['Sylvia', 'Huxley'],
    portraits: { left: 'Sylvia.png', right: 'Huxley.png' },
    narrative: [
      { speaker: '', text: '月光从树隙落下来。Huxley递给我背包时，\n三年来第一次有人把选择权交到我手里。' },
      { speaker: 'Sylvia', text: '他说他爱我。那背包很重，我的手在抖。\n但我必须自己背上它。' },
      { speaker: 'Sylvia', text: '整理行装。分类信息。\n做出最后的决定，走过那条边界线。' }
    ],
    resultTexts: {
      S: '你自己拎起背包，一气呵成套上肩膀，没有晃。\nHuxley看着你的背影消失进树林。',
      A: '你让他帮你背上这个负担，然后自己走进了黑暗。\n每一步都是你自己的选择。',
      B: '你试图自己承担全部，身体几乎放弃了。\n踉跄着站起来——伤痕累累，但走过去了。',
      C: '背包的重量压垮了最后的力气。\n是Huxley和Daisy把你送出了领地的范围。'
    }
  },
  {
    ep: 'ep13_minor', template: 'red-light-green-light', attribute: '意志',
    label: 'EP 13', title: '我自己走',
    theme: 'combat',
    bg: '银月领地 东部边界.png',
    chars: ['Sylvia', 'Cynthia'],
    portraits: { left: 'Sylvia.png', right: 'Cynthia.png' },
    narrative: [
      { speaker: '', text: 'Cynthia用一句话把James钉在了原地：\n"审议期间，她的身体状况由议会管辖。"' },
      { speaker: 'Sylvia', text: '我推开了侧门，走了出去。\n从这扇门到边界线之间的每一步，都是我要自己走的。' },
      { speaker: 'Sylvia', text: '一步一步。忍住疼痛。\n该停就停，该走就走。' }
    ],
    resultTexts: {
      S: '你赢了在议事厅里的程序战，又赢了走出去时的身体战。\n没有人需要接住你。',
      A: '你靠着Huxley走到了边界，James的怒吼在身后炸开。\n但你没有停。',
      B: '你试图自己走，在林地里踉跄了，但没有倒。\n一步步撑到了边界。',
      C: '高烧和拒绝状态的双重打击让你无法再坚持。\n是他们的力量托起了你。'
    }
  },
  {
    ep: 'ep14', template: 'color-match', attribute: '魅力',
    label: 'EP 14', title: '快没了',
    theme: 'ocean',
    bg: '中立区 溪流旁 [替代_中立区 草地].png',
    chars: ['Sylvia', 'Iris Blackwood'],
    portraits: { left: 'Sylvia.png', right: 'Iris Blackwood.png' },
    narrative: [
      { speaker: 'Sylvia', text: '三十天了，背包已经瘪下去大半。\n我的腿软在了溪边的泥地上。' },
      { speaker: '', text: 'Lyra没有回应，嘴唇干裂。\n我倒在了那里——然后Iris的手扶住了我的肩膀。' },
      { speaker: 'Sylvia', text: '感知她的情绪。辨识安全信号。\n在陌生的温暖中，找到活下去的理由。' }
    ],
    resultTexts: {
      S: '你清晰地说出了"不再是"——用你自己的声音。\n从今天开始，你用一个新的定义活着。',
      A: '声音很难发出，但你说出来了，即使破碎。\nIris没有追问，她只是托住你。',
      B: '你看了看Iris，然后低下头，什么都没有说。\n沉默有时候是最诚实的。',
      C: '三十天的独行让你忘记了如何开口。\n你闭上眼，任由泥地的湿气贴着身体。'
    }
  },
  {
    ep: 'ep15', template: 'will-surge', attribute: '意志',
    label: 'EP 15', title: '活下去',
    theme: 'energy',
    bg: '河谷领地 疗养小屋 [替代_河谷领地 豪宅].png',
    chars: ['Sylvia', 'Iris Blackwood'],
    portraits: { left: 'Sylvia.png', right: 'Iris Blackwood.png' },
    narrative: [
      { speaker: '', text: 'Iris说我身体的撕裂不会杀死我，前提是我留下。\n一个她-狼的价值与纽带无关。' },
      { speaker: 'Sylvia', text: '联络装置响了——Daisy在家被软禁。\n因为她帮我逃离。' },
      { speaker: 'Sylvia', text: '首先，活下去。\n在无助中撑住，不要崩溃。' }
    ],
    resultTexts: {
      S: '你确认了Daisy的安全，然后把装置放在夜柜上。\n为了别人而活，也是活着的一种方式。',
      A: '你的拇指动了，打出了文字，但手开始抖。\n你最终选择了放下装置。',
      B: '你压根没有碰那个装置，只是转身面向墙壁。\nDaisy的事被你深深压进了心底。',
      C: '你无法帮助Daisy，无法改变任何事。\n活着本身都显得太奢侈了。'
    }
  },
  {
    ep: 'ep16', template: 'spotlight-seek', attribute: '魅力',
    label: 'EP 16', title: '回来了',
    theme: 'sweet',
    bg: '河谷领地 疗养草地 [替代_河谷领地 豪宅].png',
    chars: ['Sylvia', 'Iris Blackwood'],
    portraits: { left: 'Sylvia.png', right: 'Iris Blackwood.png' },
    narrative: [
      { speaker: '', text: '三个月后，在月光下的草地上，\n我终于看到了Lyra——她回来了。' },
      { speaker: 'Sylvia', text: '我可以呼吸了。泪水从眼角滑下来。\nIris就在身边。' },
      { speaker: 'Sylvia', text: '被看见。被接纳。\n在光里找到自己。' }
    ],
    resultTexts: {
      S: '你放开了伪装，在Iris面前哭泣。\nLyra站在你面前——你不再需要隐藏任何东西了。',
      A: '你的泪水还在流，但你停住了。\nLyra认出了你，Iris就在身边陪着。',
      B: '你转过脸，不让人看见你的眼泪。\nLyra的鼻尖轻轻碰了你的手背。',
      C: '你保持着距离，用沉默守护自己。\n即使Lyra就在眼前，你仍然无法让眼泪自由落下。'
    }
  },
  {
    ep: 'ep17', template: 'stardew-fishing', attribute: '魅力',
    label: 'EP 17', title: '准备好了',
    theme: 'sweet',
    bg: '河谷领地 豪宅 客厅.png',
    chars: ['Sylvia', 'Iris Blackwood'],
    portraits: { left: 'Sylvia.png', right: 'Iris Blackwood.png' },
    narrative: [
      { speaker: 'Sylvia', text: '那封信放在我手里——Kennedy离开了，James结束了。\n他们要我回去。' },
      { speaker: '', text: '口袋里还藏着另一张纸条：\n"Whenever you\'re ready. I\'m here."' },
      { speaker: 'Sylvia', text: '掌握告别的节奏。\n把该说的话，在正确的时刻说出来。' }
    ],
    resultTexts: {
      S: '你直视Iris，说出了感谢。\n她说"去做一切可能"——这是释放，不是命令。',
      A: '你转身时声音低软，但你还是说了再见。\nIris在身后，静静地目送你离开。',
      B: '你在门边停顿了，想说什么却说不出来。\n最后只能无言地离开。',
      C: '你从头到尾都没有转身。\nIris的话在身后回响，但你选择了遗忘。'
    }
  },
  {
    ep: 'ep18', template: 'color-match', attribute: '魅力',
    label: 'EP 18', title: '等着你',
    theme: 'sweet',
    bg: '中立区 咖啡馆.png',
    chars: ['Sylvia', 'Huxley'],
    portraits: { left: 'Sylvia.png', right: 'Huxley.png' },
    narrative: [
      { speaker: '', text: '咖啡馆的灯光把他鬓角的白发照得很清楚。\n三年了，他说要好好做这件事。' },
      { speaker: 'Sylvia', text: '每一步都是我的选择。\nLyra在我胸腔里动了一下——该向前走了。' },
      { speaker: 'Sylvia', text: '感知他的温度。匹配情绪。\n在这个温暖的空间里，做出决定。' }
    ],
    resultTexts: {
      S: '你没有等待确认，直接站起来说"走吧"。\n他立刻跟上——你们终于可以并肩前行。',
      A: '你站起来但没有完全确定，声音比预想的小。\n他说"我就在你身后"。',
      B: '你选择留下再坐一会儿。\n时间还有很多，你需要多停留片刻。',
      C: '你一动不动，纸条在口袋里继续硌着你。\n咖啡馆的温暖让你舍不得离开。'
    }
  },
  {
    ep: 'ep19', template: 'parking-rush', attribute: '智慧',
    label: 'EP 19', title: '月下',
    theme: 'energy',
    bg: '中立区 草地.png',
    chars: ['Sylvia', 'Huxley'],
    portraits: { left: 'Sylvia.png', right: 'Huxley.png' },
    narrative: [
      { speaker: '', text: '月光铺满了开阔的草地。\nHuxley展开一张地图，北方有个陌生的坐标。' },
      { speaker: 'Sylvia', text: '十个月前我连自己的名字都快忘了。\n现在我站在满月下，Lyra清醒而安定。' },
      { speaker: 'Sylvia', text: '规划路线。移开障碍。\n做出一个没有回头路的选择。' }
    ],
    resultTexts: {
      S: '你甚至没有问细节，直接说"我们什么时候出发"。\n他用两只手递给你地图——这不是命令，是托付。',
      A: '你问清了细节，然后做出决定。\n谨慎让你安全，但也延缓了真正的自由。',
      B: '你说要出发但声音不够坚定。\n他的问题让你犹豫。',
      C: '你看着那个陌生坐标，无法决定。\n也许还没到时候。'
    }
  },
  {
    ep: 'ep20', template: 'qte-hold-release', attribute: '意志',
    label: 'EP 20', title: '此地',
    theme: 'nature',
    bg: '北极光领地 北侧开阔地 [替代_中立区 草地].png',
    chars: ['Sylvia', 'Huxley'],
    portraits: { left: 'Sylvia.png', right: 'Huxley.png' },
    narrative: [
      { speaker: '', text: '北极光在黑暗中流动，\n绿与白的光在雪地上舞动。' },
      { speaker: 'Sylvia', text: 'Daisy说我看起来不一样了——不再害怕任何东西。\n还有一封信，来自Iris。' },
      { speaker: 'Sylvia', text: '压住情绪。在正确的时机释放。\n决定是否要把这封信说出来。' }
    ],
    resultTexts: {
      S: '你大声读出Iris的话，让Huxley听见。\n这些话在你们之间落地——你不再一个人承载秘密。',
      A: '你试图说出来但又收住了，信被压进口袋。\nHuxley没有追问。',
      B: '你把信折好，投入工作。\n没有誓词，没有命令——只有选择。',
      C: '你读信的声音消失在办公室的安静里。\n过去仍在身上，你还没准备好完全放下。'
    }
  }
];

// ═══════════════════════════════════════════════════════════════════════════════
//  TEMPLATE PROCESSING
// ═══════════════════════════════════════════════════════════════════════════════

function buildCTX(ep) {
  const ctx = {
    character: { name: ep.chars[0] },
    attribute: ep.attribute,
    episodeLabel: ep.label,
    episodeTitle: ep.title,
    coverImage: `bg-scene.jpg`,
    theme: ep.theme,
    portraits: {
      left: `avatar-${ep.chars[0].toLowerCase().replace(/\s+/g, '-')}.png`,
      right: `avatar-${ep.chars[1].toLowerCase().replace(/\s+/g, '-')}.png`
    },
    names: { left: ep.chars[0], right: ep.chars[1] },
    narrative: ep.narrative,
    resultTexts: ep.resultTexts
  };
  return `window.__EPISODE_CTX__ = ${JSON.stringify(ctx, null, 2)};\n`;
}

function processEpisode(ep) {
  const templatePath = path.join(PACKS, ep.template, 'index-v3.html');
  const outDir = path.join(DATA, ep.ep, 'game');
  const outFile = path.join(outDir, 'index.html');

  // Read template
  let html = fs.readFileSync(templatePath, 'utf8');

  // Update <title>
  html = html.replace(/<title>[^<]*<\/title>/, `<title>${ep.label}: ${ep.title}</title>`);

  // Inject CTX before "var CTX = window.__EPISODE_CTX__"
  const ctxBlock = buildCTX(ep);
  // Try multiple anchor patterns (var/const, spaced/minified)
  const anchors = [
    'var CTX = window.__EPISODE_CTX__ || {};',
    'var CTX=window.__EPISODE_CTX__||{};',
    'const CTX = window.__EPISODE_CTX__ || {};',
    'const CTX=window.__EPISODE_CTX__||{};'
  ];

  let injected = false;
  for (const anchor of anchors) {
    if (html.includes(anchor)) {
      html = html.replace(anchor, ctxBlock + anchor);
      injected = true;
      break;
    }
  }
  if (!injected) {
    console.error(`  ERROR: CTX anchor not found in ${ep.template}`);
    return false;
  }

  // Ensure output directory exists
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  // Write output
  fs.writeFileSync(outFile, html, 'utf8');

  // Copy background image (compress later, for now just copy with ASCII name)
  const bgSrc = path.join(DATA, ep.ep, 'background', ep.bg);
  const bgDst = path.join(outDir, 'bg-scene.jpg');
  if (fs.existsSync(bgSrc)) {
    fs.copyFileSync(bgSrc, bgDst);
  } else {
    console.warn(`  WARN: bg not found: ${bgSrc}`);
  }

  // Copy character portrait images with ASCII names
  for (const charName of ep.chars) {
    const srcFiles = [
      path.join(DATA, ep.ep, 'character', `${charName}.png`),
      path.join(DATA, ep.ep, 'character', `${charName}.jpg`)
    ];
    const dstName = `avatar-${charName.toLowerCase().replace(/\s+/g, '-')}.png`;
    const dst = path.join(outDir, dstName);

    let copied = false;
    for (const src of srcFiles) {
      if (fs.existsSync(src)) {
        fs.copyFileSync(src, dst);
        copied = true;
        break;
      }
    }
    if (!copied) {
      console.warn(`  WARN: char not found: ${charName} in ${ep.ep}`);
    }
  }

  return true;
}

// ═══════════════════════════════════════════════════════════════════════════════
//  MAIN
// ═══════════════════════════════════════════════════════════════════════════════

console.log('=== Batch Deep Customization ===');
console.log(`Processing ${EPISODES.length} episodes (EP1 skipped - already done)\n`);

let success = 0;
let failed = 0;

for (const ep of EPISODES) {
  process.stdout.write(`${ep.ep} (${ep.template})... `);
  try {
    if (processEpisode(ep)) {
      console.log('OK');
      success++;
    } else {
      console.log('FAILED');
      failed++;
    }
  } catch (e) {
    console.log(`ERROR: ${e.message}`);
    failed++;
  }
}

console.log(`\nDone: ${success} success, ${failed} failed`);
console.log('\nTemplate distribution:');
const dist = {};
for (const ep of EPISODES) {
  dist[ep.template] = (dist[ep.template] || 0) + 1;
}
// Add EP1
dist['qte-hold-release'] = (dist['qte-hold-release'] || 0) + 1;
for (const [t, c] of Object.entries(dist).sort((a, b) => b[1] - a[1])) {
  console.log(`  ${t}: ${c}`);
}
console.log(`\nTotal templates used: ${Object.keys(dist).length}/12`);
