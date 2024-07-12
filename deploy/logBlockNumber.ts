import { writeFileSync } from 'fs-extra';
import { ethers } from 'hardhat';
import { DeployFunction } from 'hardhat-deploy/types';
import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { checkFilePathSync, convertArray2DToContent, formatDate, sleep } from '~common';
import { getExchangeDir } from './utils';

interface LogBlockNumberRecord {
  timestamp: Date;
  blockNumber: number;
}

const LENGTH = 60;
const DELAY = 1000;

const func: DeployFunction = async (_: HardhatRuntimeEnvironment): Promise<void> => {
  const logs: LogBlockNumberRecord[] = [];

  const outputDir = getExchangeDir();

  checkFilePathSync(outputDir);

  for (let i = 0; i < LENGTH; i++) {
    const blockNumber = await ethers.provider.getBlockNumber();

    const record: LogBlockNumberRecord = {
      timestamp: new Date(),
      blockNumber,
    };
    logs.push(record);

    console.log(`${formatDate(record.timestamp)}: ${blockNumber}`);

    await sleep(DELAY);
  }

  const formattedData = logs.map(({ timestamp, blockNumber }) => [
    formatDate(timestamp),
    String(blockNumber),
  ]);

  const fileName = `${new Date().getTime()}.txt`;

  writeFileSync(`${outputDir}/${fileName}`, convertArray2DToContent(formattedData));
};

func.tags = ['log-block-numbers'];

export default func;
