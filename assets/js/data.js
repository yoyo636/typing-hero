/* 打字小英雄 · 课程与词库数据 */
window.App = window.App || {};

(function (App) {
  'use strict';

  /* ---------- 内容包（packs.js，可能缺失则安全降级） ---------- */
  var P = App.packs || {
    poems: [], idioms: [], cnWords: {}, enVocab: {}, codeTexts: []
  };

  /* ---------- 词库 ---------- */
  var WORDS = {
    three: 'cat dog sun pig cow bee fox ant owl hen box cup bag hat pen big run fly sky sea arm ear egg ice key map net oil toy zoo'.split(' '),
    animal: 'cat dog bird fish tiger panda rabbit monkey elephant duck horse lion bear wolf frog snake mouse sheep'.split(' '),
    color: 'red blue green yellow black white orange pink purple brown gray circle square triangle star heart'.split(' '),
    school: 'school book pen pencil ruler bag desk chair teacher student class paper eraser crayon window door'.split(' '),
    number: 'one two three four five six seven eight nine ten Monday Tuesday Wednesday Thursday Friday Saturday Sunday'.split(' '),
    family: 'mother father sister brother grandma grandpa family baby uncle aunt friend people home'.split(' '),
    food: 'apple banana bread rice milk egg cake noodles water juice orange pear grape candy'.split(' '),
    action: 'run jump swim walk read write sing dance draw play eat drink sleep fly climb listen'.split(' '),
    weather: 'sun rain snow wind cloud hot cold warm cool spring summer autumn winter day night'.split(' '),
    body: 'head hair eye ear nose mouth hand foot leg arm face tooth finger shoulder knee'.split(' '),
    mix: 'cat dog book red run apple school one mother milk blue jump snow hand read fish bag green play'.split(' ')
  };

  /* ---------- 句子 / 短文 ---------- */
  var SENTENCES = {
    greet: [
      'Hello! How are you?', 'I am fine, thank you.', 'Good morning, teacher!',
      'Nice to meet you.', 'My name is Tom.', 'See you tomorrow!',
      'Good night, mom.', 'Thank you very much.'
    ],
    daily: [
      'What is your name?', 'I like apples and bananas.', 'Let us go to school together.',
      'This is my new book.', 'I have a little black cat.', 'My father is a doctor.',
      'It is a sunny day today.', 'Can you help me, please?', 'We are good friends.',
      'The dog is running in the park.'
    ],
    tongue: [
      'She sells seashells by the seashore.',
      'Peter Piper picked a peck of pickled peppers.',
      'How much wood would a woodchuck chuck?',
      'A big black bug bit a big black bear.',
      'Six slippery snails slid silently seaward.'
    ],
    story: [
      'Tom is a happy boy. He has a little dog. The dog is black and white. Its name is Coco. ' +
      'Every morning Tom and Coco run in the park. They see birds in the trees and fish in the lake. ' +
      'Tom likes to read books under a big tree. Coco likes to sleep on the green grass. ' +
      'In the afternoon Tom goes to school. He likes English and music. After school he plays ball with his friends. ' +
      'In the evening he helps his mother. Then he says good night to Coco and goes to bed.'
    ]
  };

  /* ---------- 课程表 ---------- */
  var chapters = [
    {
      id: 'c1',
      title: '第一章 · 键盘探秘',
      emoji: '⌨️',
      desc: '认识键盘、记住键位、学会正确的手指分工',
      lessons: [
        {
          id: 'l1-1', title: '第1课 定位键 F 和 J', type: 'keys', keys: 'fj', mix: '',
          length: 40, target: { acc: 90, speed: 15 }, newKeys: ['f', 'j'],
          tips: '双手食指轻轻放在 F 和 J 上，这两个键上有一个小横杠，闭上眼睛也能摸到哦！'
        },
        {
          id: 'l1-2', title: '第2课 左手基准键 A S D F', type: 'keys', keys: 'asdf', mix: '',
          length: 50, target: { acc: 90, speed: 18 }, newKeys: ['a', 's', 'd'],
          tips: '左手小指、无名指、中指、食指分别放在 A S D F 上，打完记得回到基准键。'
        },
        {
          id: 'l1-3', title: '第3课 右手基准键 J K L ;', type: 'keys', keys: 'jkl;', mix: '',
          length: 50, target: { acc: 90, speed: 18 }, newKeys: ['k', 'l', ';'],
          tips: '右手食指、中指、无名指、小指分别放在 J K L ; 上。'
        },
        {
          id: 'l1-4', title: '第4课 八个基准键', type: 'keys', keys: 'asdfjkl;', mix: '',
          length: 60, target: { acc: 92, speed: 22 }, newKeys: [],
          tips: '八个手指都有家，打字前先回家（ASDF JKL;）。'
        },
        {
          id: 'l1-5', title: '第5课 上排键 R T Y U', type: 'keys', keys: 'rtyu', mix: 'asdfjkl;',
          length: 60, target: { acc: 90, speed: 22 }, newKeys: ['r', 't', 'y', 'u'],
          tips: '食指向上斜着伸出去，打完 R T Y U 马上回基准键。'
        },
        {
          id: 'l1-6', title: '第6课 上排键 Q W E O P', type: 'keys', keys: 'qweop', mix: 'asdfjkl;rtyu',
          length: 60, target: { acc: 90, speed: 24 }, newKeys: ['q', 'w', 'e', 'o', 'p'],
          tips: '小指和无名指向上伸，别让整个手掌离开基准键。'
        },
        {
          id: 'l1-7', title: '第7课 下排键 C V B N M', type: 'keys', keys: 'cvbnm', mix: 'asdfjkl;',
          length: 60, target: { acc: 90, speed: 24 }, newKeys: ['c', 'v', 'b', 'n', 'm'],
          tips: '食指向下斜着伸，打完立刻回到 F 和 J。'
        },
        {
          id: 'l1-8', title: '第8课 下排键 Z X , . /', type: 'keys', keys: 'zx,./', mix: 'asdfjkl;cvbnm',
          length: 60, target: { acc: 90, speed: 24 }, newKeys: ['z', 'x', ',', '.', '/'],
          tips: '小指和无名指向下伸，慢慢来，准确率更重要。'
        },
        {
          id: 'l1-9', title: '第9课 二十六个字母', type: 'keys', keys: 'abcdefghijklmnopqrstuvwxyz', mix: '',
          length: 70, target: { acc: 92, speed: 28 }, newKeys: [],
          tips: '全键盘字母混合练习，眼睛只看屏幕，不要低头找键！'
        },
        {
          id: 'l1-10', title: '第10课 大写字母', type: 'caps', keys: 'abcdefghijklmnopqrstuvwxyz', mix: '',
          length: 60, target: { acc: 90, speed: 24 }, newKeys: ['shift'],
          tips: '按住 Shift 再按字母就是大写。左 Shift 用左手小指，右 Shift 用右手小指。'
        },
        {
          id: 'l1-11', title: '第11课 数字键 1 2 3 4 5', type: 'keys', keys: '12345', mix: 'asdf',
          length: 50, target: { acc: 90, speed: 26 }, newKeys: ['1', '2', '3', '4', '5'],
          tips: '左手手指伸到最上面一排敲数字，敲完回到 A S D F。'
        },
        {
          id: 'l1-12', title: '第12课 数字键 6 7 8 9 0', type: 'keys', keys: '67890', mix: 'jkl;',
          length: 50, target: { acc: 90, speed: 26 }, newKeys: ['6', '7', '8', '9', '0'],
          tips: '右手手指伸到最上面一排敲数字，敲完回到 J K L ;。'
        },
        {
          id: 'l1-13', title: '第13课 常用符号', type: 'keys', keys: ",./;'-", mix: 'asdfjkl;',
          length: 50, target: { acc: 88, speed: 22 }, newKeys: ['-', "'"],
          tips: '逗号句号在右边，用右手中指和无名指。'
        },
        {
          id: 'l1-14', title: '第14课 键位大闯关', type: 'keys', keys: 'abcdefghijklmnopqrstuvwxyz', mix: "0123456789,./;'",
          length: 80, target: { acc: 92, speed: 30 }, newKeys: [],
          tips: '字母、数字、符号一起来！这一课通过，你就是键盘小达人。'
        }
      ]
    },
    {
      id: 'c2',
      title: '第二章 · 单词乐园',
      emoji: '🔤',
      desc: '一边打单词一边记单词，越打越快',
      lessons: [
        { id: 'l2-1', title: '第1课 三字母单词', type: 'words', words: WORDS.three, length: 60, target: { acc: 92, speed: 30 }, newKeys: [], tips: '短单词最适合练手感，注意每个字母之间的节奏。' },
        { id: 'l2-2', title: '第2课 动物朋友', type: 'words', words: WORDS.animal, length: 70, target: { acc: 92, speed: 32 }, newKeys: [], tips: '打完想一想：tiger 是老虎，panda 是熊猫。' },
        { id: 'l2-3', title: '第3课 颜色和形状', type: 'words', words: WORDS.color, length: 70, target: { acc: 92, speed: 34 }, newKeys: [], tips: 'blue 蓝色，circle 圆形，你记住了吗？' },
        { id: 'l2-4', title: '第4课 学校用品', type: 'words', words: WORDS.school, length: 75, target: { acc: 92, speed: 34 }, newKeys: [], tips: 'pencil 铅笔，eraser 橡皮，都是天天见的好朋友。' },
        { id: 'l2-5', title: '第5课 数字和星期', type: 'words', words: WORDS.number, length: 75, target: { acc: 92, speed: 34 }, newKeys: [], tips: '星期和月份的首字母要大写哦。' },
        { id: 'l2-6', title: '第6课 家人和食物', type: 'words', words: WORDS.family.concat(WORDS.food), length: 80, target: { acc: 93, speed: 36 }, newKeys: [], tips: '一边打一边念，手口同步记得牢。' },
        { id: 'l2-7', title: '第7课 动作词', type: 'words', words: WORDS.action.concat(WORDS.body), length: 80, target: { acc: 93, speed: 38 }, newKeys: [], tips: 'run 跑、jump 跳、swim 游泳，你会拼几个？' },
        { id: 'l2-8', title: '第8课 天气和季节', type: 'words', words: WORDS.weather, length: 80, target: { acc: 93, speed: 40 }, newKeys: [], tips: '单词之间有空格，用大拇指敲空格键最轻松。' }
      ]
    },
    {
      id: 'c3',
      title: '第三章 · 句子冲浪',
      emoji: '🌊',
      desc: '从单词到句子，练习标点和空格',
      lessons: [
        { id: 'l3-1', title: '第1课 问候用语', type: 'sentence', words: SENTENCES.greet, length: 90, target: { acc: 93, speed: 40 }, newKeys: [], tips: '句首字母大写，句末记得加标点。' },
        { id: 'l3-2', title: '第2课 日常对话', type: 'sentence', words: SENTENCES.daily, length: 100, target: { acc: 93, speed: 42 }, newKeys: [], tips: '打完一句再打下一句，别着急。' },
        { id: 'l3-3', title: '第3课 英文绕口令', type: 'sentence', words: SENTENCES.tongue, length: 100, target: { acc: 92, speed: 40 }, newKeys: [], tips: '绕口令很绕，先求准，再求快。' },
        { id: 'l3-4', title: '第4课 小故事', type: 'text', text: SENTENCES.story[0], length: 240, target: { acc: 94, speed: 45 }, newKeys: [], tips: '整段文章一气呵成，注意大小写和逗号句号。' }
      ]
    },
    {
      id: 'c4',
      title: '第四章 · 汉字输入法',
      emoji: '🈶',
      desc: '用拼音输入法打汉字，中文也要打得快',
      lessons: [
        {
          id: 'l4-1', title: '第1课 数字和基本字', type: 'zh',
          text: '一二三四五六七八九十，人口手上下大小多少。天空白云，山水日月。',
          pinyin: 'yi er san si wu liu qi ba jiu shi ， ren kou shou shang xia da xiao duo shao 。 tian kong bai yun ， shan shui ri yue 。',
          length: 40, target: { acc: 90, speed: 12 }, newKeys: [],
          tips: '切换到拼音输入法，打 "yi" 就能出现 "一"。不会打就看看上面的拼音提示。'
        },
        {
          id: 'l4-2', title: '第2课 礼貌用语', type: 'zh',
          text: '你好，谢谢，再见，对不起，没关系，早上好，老师好，同学好。',
          pinyin: 'ni hao ， xie xie ， zai jian ， dui bu qi ， mei guan xi ， zao shang hao ， lao shi hao ， tong xue hao 。',
          length: 40, target: { acc: 90, speed: 14 }, newKeys: [],
          tips: '中文标点用键盘上的逗号和句号键，拼音输入法里直接按 , 和 . 就可以。'
        },
        {
          id: 'l4-3', title: '第3课 数量词', type: 'zh',
          text: '一只猫，两只狗，三本书，四支笔，五朵花，六棵树，七颗星，八个人，九条鱼，十辆车。',
          length: 50, target: { acc: 90, speed: 16 }, newKeys: [],
          tips: '量词是中文的特色，打的时候想一想"一条鱼"还是"一只鱼"。'
        },
        {
          id: 'l4-4', title: '第4课 古诗《静夜思》', type: 'zh',
          text: '床前明月光，疑是地上霜。举头望明月，低头思故乡。',
          pinyin: 'chuang qian ming yue guang ， yi shi di shang shuang 。 ju tou wang ming yue ， di tou si gu xiang 。',
          length: 40, target: { acc: 90, speed: 16 }, newKeys: [],
          tips: '李白的小诗，边打边背，不知不觉就背下来了。'
        },
        {
          id: 'l4-5', title: '第5课 小短文', type: 'zh',
          text: '春天来了，花儿开了，小鸟在树上唱歌。我和同学一起去公园放风筝，风很大，风筝飞得很高。我们跑啊跑，笑啊笑，开心极了。',
          length: 70, target: { acc: 92, speed: 20 }, newKeys: [],
          tips: '尽量一次打一个词，比如"同学"、"风筝"，比一个字一个字打快得多。'
        }
      ]
    },
    {
      id: 'c5',
      title: '第五章 · 综合实战',
      emoji: '🏆',
      desc: '真实内容大考验，看看你有多快',
      lessons: [
        {
          id: 'l5-1', title: '第1课 英文短文实战', type: 'text',
          text: 'My school day starts at seven thirty. I have four classes in the morning and two in the afternoon. ' +
            'My favorite subject is science, because we can do fun experiments. After school I play football with my friends. ' +
            'I get home at five o clock. I do my homework, then I read a story book. I go to bed at nine. What a busy day!',
          length: 240, target: { acc: 94, speed: 48 }, newKeys: [],
          tips: '这是真正的英文文章，大小写、缩写、标点都要注意。'
        },
        {
          id: 'l5-2', title: '第2课 中文短文实战', type: 'zh',
          text: '我的书包里有一本语文书、两本作业本和一个铅笔盒。每天早上，我自己整理书包，然后背着它去学校。' +
            '课堂上我认真听讲，把老师讲的重点记下来。放学后，我先写完作业，再看一会儿课外书。妈妈说，好习惯要坚持。',
          length: 90, target: { acc: 92, speed: 22 }, newKeys: [],
          tips: '一次打一个词会更快：书包、作业、铅笔盒、认真听讲。'
        },
        {
          id: 'l5-3', title: '第3课 中英文混合', type: 'keys', keys: 'abcdefghijklmnopqrstuvwxyz', mix: '0123456789',
          length: 100, target: { acc: 94, speed: 50 }, newKeys: [],
          tips: '字母和数字混着来，这是成为打字高手的最后一关！'
        }
      ]
    }
  ];

  /* ================= 由 packs 生成的章节 ================= */

  /* 古诗课：每课两首（不足则一首） */
  function chapterPoems() {
    var lessons = [];
    for (var i = 0; i < P.poems.length; i += 2) {
      var a = P.poems[i], b = P.poems[i + 1];
      var title = '《' + a.t + '》' + (b ? '《' + b.t + '》' : '');
      lessons.push({
        id: 'l6-' + (lessons.length + 1),
        title: '第' + (lessons.length + 1) + '课 ' + title,
        type: 'zh',
        text: a.s + (b ? b.s : ''),
        length: 40,
        target: { acc: 90, speed: 14 + Math.floor(lessons.length / 2) },
        newKeys: [],
        tips: (b ? a.a + '、' + b.a : a.a) + '的名诗，边打边背，一首诗很快就记牢了。'
      });
    }
    return {
      id: 'c6', title: '第六章 · 古诗与成语', emoji: '📜',
      desc: '一边打字一边背古诗学成语，语文也跟着进步',
      lessons: lessons
    };
  }

  /* 成语课：按主题切段 */
  function chapterIdioms() {
    var groups = [
      { name: '数字成语', from: 0, to: 9 },
      { name: '写景成语', from: 10, to: 21 },
      { name: '寓言成语', from: 22, to: 35 },
      { name: '勤学成语', from: 36, to: 50 }
    ];
    var lessons = groups.map(function (g, i) {
      var list = P.idioms.slice(g.from, g.to + 1);
      var text = list.map(function (x) { return x.w; }).join('，') + '。';
      return {
        id: 'l6-i' + (i + 1),
        title: '第' + (9 + i) + '课 成语·' + g.name,
        type: 'zh',
        text: text,
        length: 40,
        target: { acc: 90, speed: 15 + i },
        newKeys: [],
        tips: '打完想一想意思：' + list.slice(0, 3).map(function (x) { return x.w + '是' + x.m; }).join('；') + '。'
      };
    });
    return lessons;
  }

  /* 英文分级词汇 + 中文词语 */
  function chapterVocab() {
    var lessons = [];
    Object.keys(P.enVocab).forEach(function (theme, i) {
      lessons.push({
        id: 'l7-' + (i + 1),
        title: '第' + (i + 1) + '课 ' + theme,
        type: 'words',
        words: P.enVocab[theme],
        length: 70 + i * 2,
        target: { acc: 92, speed: 32 + i * 2 },
        newKeys: [],
        tips: '小学英语最常用的「' + theme + '」主题词汇，拼写一起记。'
      });
    });
    var cnThemes = Object.keys(P.cnWords);
    ['量词', '家庭', '学校', '时间'].forEach(function (theme, i) {
      if (cnThemes.indexOf(theme) < 0) return;
      var words = P.cnWords[theme];
      lessons.push({
        id: 'l7-c' + (i + 1),
        title: '第' + (lessons.length + 1) + '课 词语·' + theme + '（中文）',
        type: 'zh',
        text: words.join('，') + '。',
        length: 45,
        target: { acc: 90, speed: 16 + i },
        newKeys: [],
        tips: '中文用拼音输入法，尽量一次打一个词，比一个字一个字打更快。'
      });
    });
    return {
      id: 'c7', title: '第七章 · 分级词汇', emoji: '🔠',
      desc: '小学英语主题词汇与中文常用词语，边打边记单词',
      lessons: lessons
    };
  }

  /* 实用符号与混合 */
  function chapterCode() {
    var picks = [
      { name: '时间与日期', idx: [0, 1] },
      { name: '邮箱与网址', idx: [2, 3] },
      { name: '算式与数字', idx: [4, 5] },
      { name: '地址与电话', idx: [6, 7, 8] }
    ];
    var lessons = picks.map(function (g, i) {
      var text = g.idx.map(function (k) { return P.codeTexts[k] || ''; }).filter(Boolean).join(' ');
      return {
        id: 'l8-' + (i + 1),
        title: '第' + (i + 1) + '课 ' + g.name,
        type: 'text',
        text: text,
        length: Math.min(160, text.length),
        target: { acc: 92, speed: 28 + i * 3 },
        newKeys: [],
        tips: '数字、冒号、斜杠、@ 都要用到，注意大小写和空格。'
      };
    });
    lessons.push({
      id: 'l8-5', title: '第5课 综合挑战', type: 'text',
      text: P.codeTexts.join(' '),
      length: 240,
      target: { acc: 94, speed: 45 },
      newKeys: [],
      tips: '时间、算式、邮箱、网址一起来，这是最贴近真实打字的练习！'
    });
    return {
      id: 'c8', title: '第八章 · 实用符号', emoji: '🔣',
      desc: '数字、时间、邮箱、算式，这些才是真正用得到的打字',
      lessons: lessons
    };
  }

  // 追加新章节（内容来自 packs.js）
  if (P.poems.length) {
    var c6 = chapterPoems();
    c6.lessons = c6.lessons.concat(chapterIdioms());
    chapters.push(c6);
  }
  if (Object.keys(P.enVocab).length) chapters.push(chapterVocab());
  if (P.codeTexts.length) chapters.push(chapterCode());

  /* ---------- 工具 ---------- */
  function rand(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

  function keyChars(lesson) {
    return (lesson.keys || '') + (lesson.mix || '');
  }

  /* 生成键位练习文本：2~4 个字母组成一组，中间用空格隔开 */
  function buildKeyText(lesson) {
    var main = lesson.keys || 'abcdefghijklmnopqrstuvwxyz';
    var mix = lesson.mix || '';
    var chars = main.split('');
    var mixChars = mix.split('');
    var out = [];
    var total = 0;
    var len = lesson.length || 60;
    while (total < len) {
      var n = 2 + Math.floor(Math.random() * 3);
      var word = '';
      for (var i = 0; i < n; i++) {
        var useMix = mixChars.length && Math.random() < 0.28;
        var pool = useMix ? mixChars : chars;
        var c = rand(pool);
        if (lesson.type === 'caps' && Math.random() < 0.5) c = c.toUpperCase();
        word += c;
      }
      out.push(word);
      total += word.length + 1;
    }
    return out.join(' ');
  }

  function buildWordsText(lesson) {
    var out = [], total = 0, len = lesson.length || 60;
    var last = '';
    while (total < len) {
      var w = rand(lesson.words);
      if (w === last) continue;
      last = w;
      out.push(w);
      total += w.length + 1;
    }
    return out.join(' ');
  }

  function buildSentenceText(lesson) {
    var out = [], total = 0, len = lesson.length || 90;
    var pool = lesson.words.slice();
    while (total < len) {
      if (!pool.length) pool = lesson.words.slice();
      var s = pool.splice(Math.floor(Math.random() * pool.length), 1)[0];
      out.push(s);
      total += s.length + 1;
    }
    return out.join(' ');
  }

  /* 速度测试的随机文本（英文小故事/常用句拼接） */
  function buildTestText() {
    var all = SENTENCES.greet.concat(SENTENCES.daily, WORDS.mix);
    var out = [], total = 0;
    while (total < 600) {
      var s = rand(all);
      out.push(s);
      total += s.length + 1;
    }
    return out.join(' ');
  }

  /* 智能特训文本：薄弱键占 70%，其余字母占 30% */
  function buildSmartKeyText(weakKeys, len) {
    var weak = (weakKeys && weakKeys.length ? weakKeys : 'asdfjkl;'.split(''));
    var all = 'abcdefghijklmnopqrstuvwxyz'.split('');
    var out = [], total = 0;
    len = len || 80;
    while (total < len) {
      var n = 3 + Math.floor(Math.random() * 3);
      var word = '';
      for (var i = 0; i < n; i++) {
        var pool = Math.random() < 0.7 ? weak : all;
        word += rand(pool);
      }
      out.push(word);
      total += word.length + 1;
    }
    return { text: out.join(' '), keys: weak };
  }

  /* 错词重练文本：错得越多出现越频繁 */
  function buildWrongWordText(wrongWords, len) {
    var words = (wrongWords && wrongWords.length ? wrongWords : WORDS.mix);
    var pool = [];
    words.forEach(function (w) {
      var n = 1;
      if (w && typeof w === 'object') { n = Math.max(1, Math.min(4, w.n || 1)); w = w.w; }
      for (var i = 0; i < n; i++) pool.push(w);
    });
    if (!pool.length) pool = WORDS.mix;
    var out = [], total = 0;
    len = len || 80;
    while (total < len && out.length < 60) {
      var w = rand(pool);
      if (w === out[out.length - 1]) continue;
      out.push(w);
      total += w.length + 1;
    }
    return out.join(' ');
  }

  /* 今日训练计划：3 个任务 */
  function buildDailyPlan() {
    var s = App.store ? App.store.get() : {};
    var lessons = App.data ? App.data.lessons : [];
    var tasks = [];

    // 1. 继续下一节未通过的课
    var next = null;
    for (var i = 0; i < lessons.length; i++) {
      var r = (s.lessons || {})[lessons[i].id];
      if (!r || !r.passed) { next = lessons[i]; break; }
    }
    if (next) {
      tasks.push({
        icon: '📘', title: '新课：' + next.title,
        desc: '目标 ' + next.target.speed + (next.type === 'zh' ? ' 字/分' : ' WPM'),
        go: '#/practice/' + next.id, kind: 'lesson'
      });
    }

    // 2. 薄弱键专项（有错键才出现）
    var weak = App.store && App.store.topWeakKeys ? App.store.topWeakKeys(5) : [];
    if (weak.length) {
      tasks.push({
        icon: '🎯', title: '薄弱键特训：' + weak.slice(0, 4).map(function (x) { return x.k; }).join(' '),
        desc: '这几个键最容易按错，练 2 分钟就能明显改善',
        go: '#/drill', kind: 'drill'
      });
    }

    // 3. 错词复习
    var ww = App.store && App.store.topWeakWords ? App.store.topWeakWords(8) : [];
    if (ww.length) {
      tasks.push({
        icon: '🔁', title: '错词复习：' + ww.slice(0, 3).map(function (x) { return x.w; }).join(' / '),
        desc: ww.length + ' 个词打错过，再看一眼就不容易错了',
        go: '#/wrong', kind: 'wrong'
      });
    }

    // 4. 保底：复习最近学过的课
    if (tasks.length < 2) {
      var done = lessons.filter(function (l) { var r = (s.lessons || {})[l.id]; return r && r.passed; });
      if (done.length) {
        var pick = done[done.length - 1];
        tasks.push({
          icon: '⭐', title: '复习：' + pick.title,
          desc: '把通过的课再打一遍，争取拿到三星',
          go: '#/practice/' + pick.id, kind: 'lesson'
        });
      }
    }
    if (!tasks.length) {
      tasks.push({ icon: '🚀', title: '开始第一课', desc: '从定位键 F 和 J 出发', go: '#/practice/l1-1', kind: 'lesson' });
    }
    return tasks.slice(0, 3);
  }

  /* 根据课程生成练习文本 */
  function buildText(lesson) {
    if (lesson.fixedText) return lesson.fixedText;   // 智能特训 / 错词重练的定制文本
    switch (lesson.type) {
      case 'words': return buildWordsText(lesson);
      case 'sentence': return buildSentenceText(lesson);
      case 'text': return lesson.text;
      case 'zh': return lesson.text;
      case 'caps': return buildKeyText(lesson);
      default: return buildKeyText(lesson);
    }
  }

  /* 课程扁平列表 */
  var flat = [];

  function rebuildFlat() {
    flat = [];
    chapters.forEach(function (ch, ci) {
      ch.lessons.forEach(function (ls, li) {
        ls.chapterId = ch.id;
        ls.chapterTitle = ch.title;
        ls.index = flat.length;
        ls.inChapter = li;
        ls.chapterIndex = ci;
        flat.push(ls);
      });
    });
    App.data.lessons = flat;
    return flat;
  }

  /* 课后加油站（每课一句鼓励/知识） */
  var TIPS = [
    '眼睛看屏幕，手指找键位，不要低头哦！',
    '手腕放平，手指弯曲像握着一个小球。',
    '打错了不要按很多次退格，慢慢来就好。',
    '每打完一段就休息 1 分钟，看看远处的树。',
    '坐姿要端正，脚平放在地上，背挺直。',
    '速度是练出来的，每天 10 分钟就有效果。'
  ];

  App.data = {
    chapters: chapters,
    lessons: flat,
    words: WORDS,
    sentences: SENTENCES,
    tips: TIPS,
    buildText: buildText,
    buildTestText: buildTestText,
    buildSmartKeyText: buildSmartKeyText,
    buildWrongWordText: buildWrongWordText,
    buildDailyPlan: buildDailyPlan,
    rand: rand,
    getLesson: function (id) {
      for (var i = 0; i < flat.length; i++) if (flat[i].id === id) return flat[i];
      return null;
    },
    /* 用服务器下发的课程覆盖本地（服务器是课程内容的唯一来源） */
    applyRemote: function (remote) {
      if (!remote || !remote.chapters || !remote.chapters.length) return false;
      chapters.length = 0;
      remote.chapters.forEach(function (ch) { chapters.push(ch); });
      if (remote.tips && remote.tips.length) App.data.tips = remote.tips;
      rebuildFlat();
      return true;
    },
    pinyinList: function (lesson) {
      if (!lesson.pinyin) return null;
      return lesson.pinyin.split(/\s+/);
    }
  };

  rebuildFlat();
})(window.App);
