#!/usr/bin/env node

const { printHelp, cmdInit, cmdAdd, cmdList, cmdShow, cmdUpdate, cmdComplete, cmdDelete } = require('./cli');

const args = process.argv.slice(2);
const command = args[0];
const rest = args.slice(1);

switch (command) {
  case 'init':
    cmdInit();
    break;
  case 'add':
    cmdAdd(rest);
    break;
  case 'list':
    cmdList(rest);
    break;
  case 'show':
    cmdShow(rest);
    break;
  case 'update':
    cmdUpdate(rest);
    break;
  case 'complete':
    cmdComplete(rest);
    break;
  case 'delete':
    cmdDelete(rest);
    break;
  case 'help':
  case '--help':
  case '-h':
  default:
    printHelp();
    break;
}
