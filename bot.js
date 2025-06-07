console.log('Bot WhatsApp started...');
let counter = 0;

setInterval(() => {
  counter++;
  console.log(`Bot running for ${counter} seconds...`);
}, 1000);

process.on('SIGINT', () => {
  console.log('Bot stopped!');
  process.exit();
});