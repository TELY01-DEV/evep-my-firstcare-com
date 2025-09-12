// LINE Sticker packages data
export const LINE_STICKER_PACKAGES = [
  {
    packageId: '11537',
    name: 'Brown & Cony 1',
    stickers: [
      { stickerId: '52002734', emoji: '😀' },
      { stickerId: '52002735', emoji: '😃' },
      { stickerId: '52002736', emoji: '😄' },
    ]
  },
  {
    packageId: '11538',
    name: 'Brown & Cony 2',
    stickers: [
      { stickerId: '51626494', emoji: '😊' },
      { stickerId: '51626495', emoji: '😋' },
      { stickerId: '51626496', emoji: '😎' },
    ]
  }
];

export const getLineStickerUrl = (packageId: string, stickerId: string) => {
  return `https://stickershop.line-scdn.net/stickershop/v1/sticker/${stickerId}/android/sticker.png`;
};
