const originalPlatform = Object.getOwnPropertyDescriptor(process, 'platform');
const originalEnv = { ...process.env };

const setPlatform = (platform) => {
  Object.defineProperty(process, 'platform', {
    value: platform,
    configurable: true,
  });
};

const restore = () => {
  Object.defineProperty(process, 'platform', originalPlatform);
  process.env = { ...originalEnv };
};

const sleep = (ms) => new Promise((resolve) => {
  setTimeout(resolve, ms);
});

module.exports = {
  setPlatform,
  restore,
  sleep,
};
