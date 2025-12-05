
import { RangeSdkAppId } from '@ad-audit/range-sdk';
import { WordData } from '../bam-auto-generate/bes.fe.web_core/namespaces/dictionary';

// 生成模拟数据
const generateMockData = (appid: RangeSdkAppId | number, words: string[]) => {
    const mockEntries: Record<string, WordData> = {};
    words.forEach((word, index) => {
      mockEntries[word] = {
        id: index + 1,
        appid: typeof appid === 'number' ? appid : RangeSdkAppId.RANGE_SDK,
        word,
        en_word: `xxxx__English`,
        content: `<p><strong>${word}</strong> 是一个重要的业务术语。</p><p>这是关于"${word}"的详细说明，包含了该词条的定义、使用场景和相关注意事项。</p>`,
        alias_words: [`${word}别名1`, `${word}别名2`],
        tags: ['业务术语', '重要概念'],
        lark_doc_links: [`https://bytedance.larkoffice.com/docs/xxx`],
        web_links: [`https://example.com/xxx`],
        owners: ['liyanlong.locker', 'lianshanchun'],
        image_links: Array.from({ length: 10 }, () =>
          'https://p-bes-img.bytedance.net/tos-cn-i-mzjikbws1s/76e24f794b7f4b378e0b2284289707da~tplv-mzjikbws1s-webp.webp'
        ),
        word_status: 1,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
    });
    return mockEntries;
};

export {
  generateMockData
}
