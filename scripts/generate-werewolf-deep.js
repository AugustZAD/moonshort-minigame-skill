#!/usr/bin/env node
/**
 * Deep Customization Generator for Werewolf Episodes
 * Reads EP1 game as master template, replaces CTX block for each episode.
 * All episodes use qte-hold-release V3 template (hold-release = willpower/restraint).
 */

const fs = require('fs');
const path = require('path');

const BASE = path.resolve(__dirname, '../data/狼人');
const MASTER = path.join(BASE, 'ep1/game/index.html');

// Read master template
const master = fs.readFileSync(MASTER, 'utf8');

// ─── All 21 Episode CTX Configs ─────────────────────────────────────────────

const EPISODES = [
  {
    ep: '2', gameId: 'ep2-tool',
    episodeLabel: 'EP 2', episodeTitle: '工具',
    attribute: '意志', theme: 'dark',
    coverImage: 'bg-main.png',
    portraits: { left: 'avatar-sylvia.png', right: 'avatar-james.png' },
    names: { left: 'Sylvia', right: 'James' },
    dialogueText: '压住情绪，记住每一个字。',
    gaugeLabel: '意志',
    narrative: [
      { speaker: 'Sylvia', text: '"The Pack needed an heir. You were the solution."\nLuna Miller的话在客厅里回荡。' },
      { speaker: '', text: 'Daisy的手死死捏住壁灯架。\nJames看向地板，一言不发。' },
      { speaker: 'Sylvia', text: '记住一切。等时机到了再开口。' }
    ],
    resultTexts: {
      S: '你记住了Luna Miller的每一个字。\n这些话会成为你的武器——在她以为你已经遗忘的时候。',
      A: '你和Daisy一起记住了这一切。\n你们不再是孤军奋战。',
      B: '壁炉的火还在烧。\n你的决心也还没有熄灭。',
      C: '你低下了头。\n但低头不代表认输——只是还需要更多时间。'
    },
    bgmStyle: 'tense'
  },
  {
    ep: '3', gameId: 'ep3-substitute',
    episodeLabel: 'EP 3', episodeTitle: '替代品',
    attribute: '意志', theme: 'mystery',
    coverImage: 'bg-main.png',
    portraits: { left: 'avatar-sylvia.png', right: 'avatar-daisy.png' },
    names: { left: 'Sylvia', right: 'Daisy' },
    dialogueText: '屏住呼吸，不要暴露自己。',
    gaugeLabel: '意志',
    narrative: [
      { speaker: 'Sylvia', text: '走廊尽头，Luna Miller书房的门缝透出一条光。\n里面有人在争论。' },
      { speaker: '', text: '那条光打在Sylvia的侧脸上。\n她的眼睛微微收窄，盯着门缝。' },
      { speaker: 'Sylvia', text: '听清楚。每一个字都可能有用。' }
    ],
    resultTexts: {
      S: '你听清了每一个字，记住了每一个声音。\nLuna Miller不知道——她的秘密已经不再安全。',
      A: '你在门外站了足够久。\n这些碎片终会拼成完整的真相。',
      B: '你听到了一些东西。\n虽然不完整，但足以让你保持警觉。',
      C: '走廊的灯光太暗了。\n你什么都没听清——但你知道这扇门背后藏着什么。'
    },
    bgmStyle: 'tense'
  },
  {
    ep: '4', gameId: 'ep4-scrutiny',
    episodeLabel: 'EP 4', episodeTitle: '打量',
    attribute: '意志', theme: 'dark',
    coverImage: 'bg-main.png',
    portraits: { left: 'avatar-sylvia.png', right: 'avatar-cynthia.png' },
    names: { left: 'Sylvia', right: 'Cynthia' },
    dialogueText: '她在审视你。不要露出破绽。',
    gaugeLabel: '意志',
    narrative: [
      { speaker: '', text: '书房门从里面推开。\nCynthia走出来，与Sylvia正面撞上视线。' },
      { speaker: '', text: 'Cynthia的目光从她脸上移到隆起的腹部，\n又抬回来，停了整整三秒。' },
      { speaker: 'Sylvia', text: '不要退缩。让她看。' }
    ],
    resultTexts: {
      S: '你在Cynthia的审视下纹丝不动。\n她看到了一个不会被轻易摆布的人。',
      A: '你承受住了那三秒的对视。\n她记住了你的眼神。',
      B: '你没有退后。\n这已经是一种回答。',
      C: '你的目光先移开了。\n但你没有离开——这比她预想的要多。'
    },
    bgmStyle: 'tense'
  },
  {
    ep: '5', gameId: 'ep5-breaking-point',
    episodeLabel: 'EP 5', episodeTitle: '撑不住',
    attribute: '意志', theme: 'dark',
    coverImage: 'bg-main.png',
    portraits: { left: 'avatar-sylvia.png', right: 'avatar-elara-vance.png' },
    names: { left: 'Sylvia', right: 'Elara' },
    dialogueText: '她说你只剩一个满月的时间。',
    gaugeLabel: '意志',
    narrative: [
      { speaker: 'Elara', text: '如果满月之前不解决，你会……死。' },
      { speaker: '', text: '陶罐被推到面前。\n小屋里只剩烛火轻轻晃动的声音。' },
      { speaker: 'Sylvia', text: '不能崩溃。还有时间。' }
    ],
    resultTexts: {
      S: '你接过了真相，没有让它把你压垮。\n满月之前——你会找到出路。',
      A: '你的手在发抖，但你没有放开陶罐。\n至少你知道了时限。',
      B: '你坐在那里很久。\n恐惧没有消失，但你还在呼吸。',
      C: '你差点被这个消息击倒。\n但"差点"不是"已经"。'
    },
    bgmStyle: 'tense'
  },
  {
    ep: '6', gameId: 'ep6-pawn',
    episodeLabel: 'EP 6', episodeTitle: '棋子',
    attribute: '意志', theme: 'dark',
    coverImage: 'bg-main.png',
    portraits: { left: 'avatar-sylvia.png', right: 'avatar-luna-miller.png' },
    names: { left: 'Sylvia', right: 'Luna Miller' },
    dialogueText: '她在下棋。而你——曾经是她的棋子。',
    gaugeLabel: '意志',
    narrative: [
      { speaker: 'Sylvia', text: '月神给了他我。' },
      { speaker: 'Luna Miller', text: '"一个解决方案。在最合适的时间。"' },
      { speaker: 'Sylvia', text: '听完她说的每一个字。然后站起来。' }
    ],
    resultTexts: {
      S: '你把Luna Miller的话原封不动还给了她。\n她的棋子学会了自己走棋。',
      A: '你站了起来。\n虽然她的目光还在你背上，但你已经不在她的棋盘上了。',
      B: '你听完了。\n这些话在你心里生了根——它们会长成别的东西。',
      C: '你还坐在那里。\n但你的眼睛已经不一样了。'
    },
    bgmStyle: 'tense'
  },
  {
    ep: '7', gameId: 'ep7-jealousy',
    episodeLabel: 'EP 7', episodeTitle: '嫉妒',
    attribute: '意志', theme: 'dark',
    coverImage: 'bg-main.png',
    portraits: { left: 'avatar-sylvia.png', right: 'avatar-james.png' },
    names: { left: 'Sylvia', right: 'James' },
    dialogueText: '嫉妒在胸口燃烧。压住它。',
    gaugeLabel: '意志',
    narrative: [
      { speaker: '', text: '议事厅的门关上了。\nKennedy的名字还挂在James嘴边。' },
      { speaker: '', text: '她的手覆上腹部，停了两秒，然后放下。' },
      { speaker: 'Sylvia', text: '不是现在。等一个更好的时机。' }
    ],
    resultTexts: {
      S: '你压住了嫉妒，带着清醒走向了对峙。\n这一次，你掌握了节奏。',
      A: '你在窗边站了很久。\n当你转身面对那扇门时，你已经准备好了。',
      B: '嫉妒还在烧。\n但你没有让它替你做决定。',
      C: '你的手在发抖。\n但至少——你没有先开口。'
    },
    bgmStyle: 'tense'
  },
  {
    ep: '8', gameId: 'ep8-no-denial',
    episodeLabel: 'EP 8', episodeTitle: '没有否认',
    attribute: '意志', theme: 'dark',
    coverImage: 'bg-main.png',
    portraits: { left: 'avatar-sylvia.png', right: 'avatar-james.png' },
    names: { left: 'Sylvia', right: 'James' },
    dialogueText: '他没有否认。等他说出真相。',
    gaugeLabel: '意志',
    narrative: [
      { speaker: 'Sylvia', text: '我从来不是你的伴侣。\n我只是你母亲的解决方案。' },
      { speaker: '', text: '沉默压下来。\nJames的手指慢慢收紧，垂在身侧。' },
      { speaker: 'Sylvia', text: '等他开口。不要替他说。' }
    ],
    resultTexts: {
      S: '他没有否认。而你从他的沉默中得到了比否认更清晰的答案。\n真相现在属于你了。',
      A: '他的沉默就是你的答案。\n你不再需要他的话来确认任何事。',
      B: '房间里安静得可怕。\n但至少你说出了那句话。',
      C: '你的声音颤了一下。\n但那句话已经出口了——它不会被收回。'
    },
    bgmStyle: 'tense'
  },
  {
    ep: '9', gameId: 'ep9-give-me',
    episodeLabel: 'EP 9', episodeTitle: '给我',
    attribute: '意志', theme: 'mystery',
    coverImage: 'bg-main.png',
    portraits: { left: 'avatar-sylvia.png', right: 'avatar-elara-vance.png' },
    names: { left: 'Sylvia', right: 'Elara' },
    dialogueText: '你知道自己需要什么。开口要。',
    gaugeLabel: '意志',
    narrative: [
      { speaker: 'Elara', text: '你知道的。' },
      { speaker: 'Sylvia', text: '我知道。' },
      { speaker: '', text: '两个字落地。\n小屋里彻底静下来，烛火轻轻晃了一下。' }
    ],
    resultTexts: {
      S: '你说出了自己需要什么，没有犹豫，没有退缩。\n从现在起，你的选择属于你自己。',
      A: '你开口了。\n虽然声音不大，但Elara听见了——这就够了。',
      B: '你伸出手接过了草药。\n不是因为别无选择，是因为你做了决定。',
      C: '你的手停在半空中很久。\n但最终——你还是接住了。'
    },
    bgmStyle: 'tense'
  },
  {
    ep: '10', gameId: 'ep10-extinguish',
    episodeLabel: 'EP 10', episodeTitle: '熄灭',
    attribute: '意志', theme: 'dark',
    coverImage: 'bg-main.png',
    portraits: { left: 'avatar-sylvia.png', right: 'avatar-james.png' },
    names: { left: 'Sylvia', right: 'James' },
    dialogueText: '连结在断裂。撑住最后一刻。',
    gaugeLabel: '意志',
    narrative: [
      { speaker: 'Sylvia', text: '我保护了他。\n让他远离这一切。远离你。' },
      { speaker: '', text: 'James的手猛地伸向她的咽喉——\n触到皮肤的瞬间，他停住了。' },
      { speaker: 'Sylvia', text: '不要后退。他会先松手的。' }
    ],
    resultTexts: {
      S: '你直视着他的眼睛，一步都没有退。\n他的手先放下了。连结断裂的声音，只有你听得见。',
      A: '你没有闪避。\n当他的手垂下来的时候，你知道——结束了。',
      B: '你的脖子上还残留着他手指的温度。\n但你还站着。',
      C: '你的身体在发抖。\n但你的脚没有动——这是你最后的倔强。'
    },
    bgmStyle: 'tense'
  },
  {
    ep: '11', gameId: 'ep11-no-take-back',
    episodeLabel: 'EP 11', episodeTitle: '撤不回',
    attribute: '意志', theme: 'combat',
    coverImage: 'bg-main.png',
    portraits: { left: 'avatar-sylvia.png', right: 'avatar-james.png' },
    names: { left: 'Sylvia', right: 'James' },
    dialogueText: '话已出口。撑住Alpha命令的压力。',
    gaugeLabel: '意志',
    narrative: [
      { speaker: 'Sylvia', text: '我，Sylvia，正式拒绝这段连结。\n在所有证人面前。' },
      { speaker: 'James', text: '"我命令你收回那句话。现在。"' },
      { speaker: '', text: 'Alpha命令砸下来。\n她的双膝触地——但她一节一节地站了起来。' }
    ],
    resultTexts: {
      S: '你在整个议事厅面前站了起来。\n话已出口，撤不回。你不需要撤回。',
      A: '你站直了身体。\n虽然还在喘气，但你的声音没有颤抖。',
      B: '你跪在石板上很久。\n但你没有说出"我收回"那三个字。',
      C: '你的膝盖还在疼。\n但你咬住了牙——那句话，永远不会被收回。'
    },
    bgmStyle: 'action'
  },
  {
    ep: '12', gameId: 'ep12-waiting-for-you',
    episodeLabel: 'EP 12', episodeTitle: '等你了',
    attribute: '意志', theme: 'dark',
    coverImage: 'bg-main.png',
    portraits: { left: 'avatar-sylvia.png', right: 'avatar-daisy.png' },
    names: { left: 'Sylvia', right: 'Daisy' },
    dialogueText: '走廊外传来脚步声。现在就走。',
    gaugeLabel: '意志',
    narrative: [
      { speaker: 'Daisy', text: 'Huxley在东部边界等你。\n包已经打好了。' },
      { speaker: '', text: '走廊外集会散场的脚步声渐渐远去。' },
      { speaker: 'Sylvia', text: '不回头。往前走。' }
    ],
    resultTexts: {
      S: '你靠自己的双腿走出了那扇门。\n没有人替你做这个决定——你自己走的。',
      A: '你走出了走廊。\n高烧在烧，但你的脚步没有停。',
      B: '你离开了。\n虽然每一步都很重，但方向是对的。',
      C: '你差点停下来。\n但Daisy的手拉住了你——你们一起走出了那扇门。'
    },
    bgmStyle: 'tense'
  },
  {
    ep: '12_minor', gameId: 'ep12m-sit-still',
    episodeLabel: 'EP 12', episodeTitle: '坐着别动',
    attribute: '意志', theme: 'dark',
    coverImage: 'bg-main.png',
    portraits: { left: 'avatar-sylvia.png', right: 'avatar-james.png' },
    names: { left: 'Sylvia', right: 'James' },
    dialogueText: '不完整的拒绝在发作。坐直。',
    gaugeLabel: '意志',
    narrative: [
      { speaker: '', text: '议事程序继续推进。\nSylvia坐在原位，一言不发。' },
      { speaker: '', text: '热从后背蔓延上来。\n不完整的拒绝状态开始发作。' },
      { speaker: 'Sylvia', text: '坐直。不要让他们看出来。' }
    ],
    resultTexts: {
      S: '你坐到了最后一个人离开。\n你的沉着改变了整个议事厅的力量格局。',
      A: '你撑过了发作。\n当你站起来的时候，你的姿态没有一丝软弱。',
      B: '你的指节在扶手上泛白。\n但你没有离席——这已经是一种胜利。',
      C: '你差点从椅子上滑下去。\n但"差点"不是"已经"——你还坐在那里。'
    },
    bgmStyle: 'tense'
  },
  {
    ep: '13', gameId: 'ep13-walk-in',
    episodeLabel: 'EP 13', episodeTitle: '走进去',
    attribute: '意志', theme: 'nature',
    coverImage: 'bg-main.png',
    portraits: { left: 'avatar-sylvia.png', right: 'avatar-huxley.png' },
    names: { left: 'Sylvia', right: 'Huxley' },
    dialogueText: '高烧拉着你往下坠。继续走。',
    gaugeLabel: '意志',
    narrative: [
      { speaker: 'Huxley', text: '我不要求什么。不是现在。\n但如果有一天你准备好了——我会在那里。' },
      { speaker: '', text: '夜风灌进来。\n东部边界的方向，月光铺在树林间。' },
      { speaker: 'Sylvia', text: '一步一步。不停下来。' }
    ],
    resultTexts: {
      S: '你靠自己的双腿走到了边界。\n这是你收到的第一份无条件的善意。',
      A: '你走到了。\n虽然最后几步几乎是靠惯性，但你到了。',
      B: '你倒在了边界线上。\n但你倒在了正确的那一边。',
      C: '你走不动了。\n但Huxley没有抱你——他只是走在你旁边，等你自己迈出下一步。'
    },
    bgmStyle: 'tense'
  },
  {
    ep: '13_minor', gameId: 'ep13m-walk-alone',
    episodeLabel: 'EP 13', episodeTitle: '我自己走',
    attribute: '意志', theme: 'dark',
    coverImage: 'bg-main.png',
    portraits: { left: 'avatar-sylvia.png', right: 'avatar-james.png' },
    names: { left: 'Sylvia', right: 'James' },
    dialogueText: '他们在身后。不要停。',
    gaugeLabel: '意志',
    narrative: [
      { speaker: '', text: 'Sylvia推开侧门走出去。\n夜风灌进来。' },
      { speaker: '', text: 'Huxley跟在她身侧，一步之遥，没有碰她。\nDaisy在最后面，把门带上。' },
      { speaker: 'Sylvia', text: '我自己走。不需要人扶。' }
    ],
    resultTexts: {
      S: '你自己走完了全程。\n没有人扶你——因为你不需要。',
      A: '你的脚步越来越慢，但方向从未改变。\n他们在你身后，但你在前面。',
      B: '你走出了豪宅的围墙。\n至少——你是自己走出来的。',
      C: '你停了好几次。\n但每一次都重新迈开了步子。'
    },
    bgmStyle: 'tense'
  },
  {
    ep: '14', gameId: 'ep14-running-out',
    episodeLabel: 'EP 14', episodeTitle: '快没了',
    attribute: '意志', theme: 'nature',
    coverImage: 'bg-main.png',
    portraits: { left: 'avatar-sylvia.png', right: 'avatar-iris-blackwood.png' },
    names: { left: 'Sylvia', right: 'Iris' },
    dialogueText: '她在问你是什么人。回答她。',
    gaugeLabel: '意志',
    narrative: [
      { speaker: 'Iris', text: '你是独狼吗？' },
      { speaker: '', text: 'Sylvia的嘴唇动了一下。\n喉咙滚动了一下，没有立刻说话。' },
      { speaker: 'Sylvia', text: '说出来。你是谁。' }
    ],
    resultTexts: {
      S: '你说出了自己的名字和来历，没有躲闪。\n这是你第一次在陌生人面前定义自己。',
      A: '你回答了她的问题。\n虽然声音很轻，但每个字都是真的。',
      B: '你说了一些。\n不够完整，但足以让她决定帮你。',
      C: '你几乎说不出话。\n但你的眼神告诉了Iris她需要知道的一切。'
    },
    bgmStyle: 'tense'
  },
  {
    ep: '15', gameId: 'ep15-survive',
    episodeLabel: 'EP 15', episodeTitle: '活下去',
    attribute: '意志', theme: 'nature',
    coverImage: 'bg-main.png',
    portraits: { left: 'avatar-sylvia.png', right: 'avatar-iris-blackwood.png' },
    names: { left: 'Sylvia', right: 'Iris' },
    dialogueText: 'Daisy被软禁了。你不能倒下。',
    gaugeLabel: '意志',
    narrative: [
      { speaker: '', text: '屏幕上Kayden的消息：\n"Daisy被软禁了。James发现了。她联系不上你了。"' },
      { speaker: '', text: 'Sylvia坐在床沿，盯着那行字。\n手指收紧了床单。' },
      { speaker: 'Sylvia', text: '活下去。为她也要活下去。' }
    ],
    resultTexts: {
      S: '你在Daisy够不到的地方替她做了决定。\n她会知道——你没有放弃。',
      A: '你稳住了自己。\n虽然帮不了Daisy，但你没有让自己倒下。',
      B: '你哭了很久。\n但你没有把药草放下。',
      C: '你差点放弃了。\n但那条消息提醒你——还有人在等你回去。'
    },
    bgmStyle: 'tense'
  },
  {
    ep: '16', gameId: 'ep16-came-back',
    episodeLabel: 'EP 16', episodeTitle: '回来了',
    attribute: '意志', theme: 'nature',
    coverImage: 'bg-main.png',
    portraits: { left: 'avatar-sylvia.png', right: 'avatar-iris-blackwood.png' },
    names: { left: 'Sylvia', right: 'Iris' },
    dialogueText: '三个月了。你准备好被看见了吗？',
    gaugeLabel: '意志',
    narrative: [
      { speaker: '', text: '三个月过去了。\n文件上密密麻麻的批注，全是她的笔迹。' },
      { speaker: '', text: '月光铺在疗养草地上。\nSylvia一个人走在河谷领地的夜色里。' },
      { speaker: 'Sylvia', text: '不再躲了。让他们看到我。' }
    ],
    resultTexts: {
      S: '你让自己被看见了，没有退缩。\n这是你重新拿回自己的开始。',
      A: '你走出了疗养小屋。\n河谷的风和三个月前不一样了——因为你不一样了。',
      B: '你站在月光下。\n虽然还有些犹豫，但你的脚没有往回走。',
      C: '你在门口站了很久。\n但最终——你还是迈出了那一步。'
    },
    bgmStyle: 'tense'
  },
  {
    ep: '17', gameId: 'ep17-ready',
    episodeLabel: 'EP 17', episodeTitle: '准备好了',
    attribute: '魅力', theme: 'sweet',
    coverImage: 'bg-main.png',
    portraits: { left: 'avatar-sylvia.png', right: 'avatar-iris-blackwood.png' },
    names: { left: 'Sylvia', right: 'Iris' },
    dialogueText: '你准备好了。让她看到。',
    gaugeLabel: '魅力',
    narrative: [
      { speaker: 'Sylvia', text: '我准备好了。' },
      { speaker: 'Iris', text: '那就走吧。' },
      { speaker: '', text: '她拿起背包，走向走廊。\nIris的目光里有一种安静的认可。' }
    ],
    resultTexts: {
      S: '你说出了Iris给了你什么，完整地接受了它。\n你的魅力不是表演——是真实。',
      A: '你的声音平稳，目光清澈。\nIris看到了她三个月照顾的成果。',
      B: '你拿起了背包。\n虽然手还有些抖，但方向是确定的。',
      C: '你在走廊里停了一下。\n但Iris的点头让你继续往前走了。'
    },
    bgmStyle: 'action'
  },
  {
    ep: '18', gameId: 'ep18-waiting',
    episodeLabel: 'EP 18', episodeTitle: '等着你',
    attribute: '意志', theme: 'ocean',
    coverImage: 'bg-main.png',
    portraits: { left: 'avatar-sylvia.png', right: 'avatar-huxley.png' },
    names: { left: 'Sylvia', right: 'Huxley' },
    dialogueText: '他在等你的决定。不要急。',
    gaugeLabel: '意志',
    narrative: [
      { speaker: 'Huxley', text: '今晚满月。我找到了一片安静的草地。' },
      { speaker: '', text: '他的视线收回来，落在她脸上。' },
      { speaker: 'Huxley', text: '不是命令。只是——如果你想的话。' }
    ],
    resultTexts: {
      S: '你没有等他请求第二次。\n你主动迈出了那一步——不需要许可。',
      A: '你点了头。\n咖啡馆的灯光里，这个决定很安静，但很确定。',
      B: '你想了很久。\n但当你站起来的时候，答案已经在你脚下了。',
      C: '你差点说"不"。\n但你没有——因为你知道自己其实想去。'
    },
    bgmStyle: 'action'
  },
  {
    ep: '19', gameId: 'ep19-moonlight',
    episodeLabel: 'EP 19', episodeTitle: '月下',
    attribute: '意志', theme: 'ocean',
    coverImage: 'bg-main.png',
    portraits: { left: 'avatar-sylvia.png', right: 'avatar-huxley.png' },
    names: { left: 'Sylvia', right: 'Huxley' },
    dialogueText: '月光下，他递来一张地图。',
    gaugeLabel: '意志',
    narrative: [
      { speaker: '', text: 'Huxley展开一张地图。\n月光打在纸面上，北方有一处手写标记。' },
      { speaker: 'Huxley', text: '极光Pack。Alpha Morgan在等。\n他们需要一个懂得怎么管理领地的人。' },
      { speaker: 'Sylvia', text: '不是逃跑。是选择。' }
    ],
    resultTexts: {
      S: '你果断做出了决定，不需要任何人替你确认。\n月光下，你看到了自己的方向。',
      A: '你接过了地图。\n北方——一个全新的开始在等你。',
      B: '你看着那个标记。\n还没有完全决定，但你已经知道答案了。',
      C: '你犹豫了。\n但地图还在你手里——这意味着你没有拒绝。'
    },
    bgmStyle: 'action'
  },
  {
    ep: '20', gameId: 'ep20-here',
    episodeLabel: 'EP 20', episodeTitle: '此地',
    attribute: '意志', theme: 'energy',
    coverImage: 'bg-main.png',
    portraits: { left: 'avatar-sylvia.png', right: 'avatar-huxley.png' },
    names: { left: 'Sylvia', right: 'Huxley' },
    dialogueText: '此地。从这里开始新的一切。',
    gaugeLabel: '意志',
    narrative: [
      { speaker: '', text: '晨光射进来。\n桌上那摞档案最上面压着一封信。' },
      { speaker: 'Sylvia', text: '"我就知道你会找到路的。"\n——Iris Blackwood' },
      { speaker: 'Sylvia', text: '此地。就从这里开始。' }
    ],
    resultTexts: {
      S: '你念出了Iris的话，让它在你和Huxley之间落地。\n从今天起，你不再是谁的工具、棋子或替代品。',
      A: '你看完了那封信。\n新的领地、新的开始——你准备好了。',
      B: '你坐在桌前。\n档案上的字迹是你的——你已经开始了。',
      C: '晨光刺进你的眼睛。\n一个全新的早晨——至少方向是对的。'
    },
    bgmStyle: 'action'
  }
];

// ─── Template Engine ────────────────────────────────────────────────────────

function generateGame(epConfig) {
  let html = master;

  // 1. Replace <title> tag
  html = html.replace(
    /<title>.*?<\/title>/,
    `<title>${epConfig.episodeLabel}: ${epConfig.episodeTitle}</title>`
  );

  // 2. Replace default title text in DOM
  html = html.replace(
    /id="title-text">.*?</,
    `id="title-text">${epConfig.episodeLabel}: ${epConfig.episodeTitle}<`
  );

  // 3. Replace portrait initials
  const leftInitial = epConfig.names.left.charAt(0);
  const rightInitial = epConfig.names.right.charAt(0);
  html = html.replace(
    /id="portrait-left">.</,
    `id="portrait-left">${leftInitial}<`
  );
  html = html.replace(
    /id="portrait-right">.</,
    `id="portrait-right">${rightInitial}<`
  );

  // 4. Replace default names in DOM
  html = html.replace(
    /id="name-left">.*?</,
    `id="name-left">${epConfig.names.left}<`
  );
  html = html.replace(
    /id="name-right">.*?</,
    `id="name-right">${epConfig.names.right}<`
  );

  // 5. Replace dialogue text
  html = html.replace(
    /id="dialogue">.*?</,
    `id="dialogue">${epConfig.dialogueText}<`
  );

  // 6. Replace gauge label
  html = html.replace(
    /<div class="gauge-label">.*?<\/div>/,
    `<div class="gauge-label">${epConfig.gaugeLabel}</div>`
  );

  // 7. Replace score label (意志值)
  html = html.replace(
    /<span class="label">意志值<\/span>/,
    `<span class="label">${epConfig.gaugeLabel}值</span>`
  );

  // 8. Replace the CTX block
  const ctxBlock = `window.__EPISODE_CTX__ = ${JSON.stringify({
    character: { name: 'Sylvia' },
    attribute: epConfig.attribute,
    episodeLabel: epConfig.episodeLabel,
    episodeTitle: epConfig.episodeTitle,
    coverImage: epConfig.coverImage,
    theme: epConfig.theme,
    portraits: epConfig.portraits,
    names: epConfig.names,
    narrative: epConfig.narrative,
    resultTexts: epConfig.resultTexts
  }, null, 2)};`;

  // Replace from "window.__EPISODE_CTX__" to the closing "};' before "// ── Host context"
  html = html.replace(
    /window\.__EPISODE_CTX__\s*=\s*\{[\s\S]*?\};/,
    ctxBlock
  );

  // 9. Replace comment header
  html = html.replace(
    /\/\/  EP1 Episode Context.*/,
    `//  EP${epConfig.ep} Episode Context — 只通过 CTX 注入数据，不改模板 UI/UX 布局`
  );

  // 10. Replace gameId in ResultScene
  html = html.replace(
    /gameId: 'ep1-silence-power'/g,
    `gameId: '${epConfig.gameId}'`
  );

  // 11. Replace BGM style if different
  if (epConfig.bgmStyle) {
    // Find the bgm call in BootScene and replace
    html = html.replace(
      /audio\.bgm\('(action|tense)'\)/,
      `audio.bgm('${epConfig.bgmStyle}')`
    );
  }

  // 12. Replace gauge-status text if attribute is 魅力
  if (epConfig.attribute === '魅力') {
    html = html.replace(/长按蓄力/g, '长按积蓄');
    html = html.replace(/快到极限!/g, '魅力满溢!');
    html = html.replace(/情绪崩溃!/g, '节奏失控!');
    html = html.replace(/压住情绪…/g, '保持节奏…');
    // Replace gauge score label
    html = html.replace(/意志值/g, '魅力值');
    // Replace result stat labels
    html = html.replace(/\\u610F\\u5FD7\\u503C/g, '\\u9B45\\u529B\\u503C'); // 意志值 -> 魅力值
  }

  return html;
}

// ─── Generate All Games ─────────────────────────────────────────────────────

let generated = 0;
let errors = [];

EPISODES.forEach(epConfig => {
  const epDir = path.join(BASE, `ep${epConfig.ep}/game`);
  const outFile = path.join(epDir, 'index.html');

  try {
    // Ensure game directory exists
    if (!fs.existsSync(epDir)) {
      fs.mkdirSync(epDir, { recursive: true });
    }

    const html = generateGame(epConfig);
    fs.writeFileSync(outFile, html, 'utf8');
    generated++;
    console.log(`✓ EP${epConfig.ep} "${epConfig.episodeTitle}" → ${outFile}`);
  } catch (e) {
    errors.push(`EP${epConfig.ep}: ${e.message}`);
    console.error(`✗ EP${epConfig.ep}: ${e.message}`);
  }
});

console.log(`\nGenerated: ${generated}/${EPISODES.length}`);
if (errors.length) {
  console.log('Errors:', errors.join('\n'));
}
