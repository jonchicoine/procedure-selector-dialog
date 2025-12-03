/**
 * Run this script to generate the initial procedures.json config file.
 * Usage: npx ts-node utils/generateConfig.ts
 */
import { PROCEDURES } from '../constants';
import { migrateProceduresToConfig, configToJson } from './migrateProcedures';
import * as fs from 'fs';
import * as path from 'path';

const config = migrateProceduresToConfig(PROCEDURES);
const json = configToJson(config);

const outputPath = path.join(__dirname, '..', 'procedures.json');
fs.writeFileSync(outputPath, json, 'utf-8');

console.log(`Generated ${outputPath}`);
console.log(`Total procedures: ${config.procedures.length}`);
console.log(`Procedures with fields: ${config.procedures.filter(p => p.fields.length > 0).length}`);
console.log(`Procedures without fields (immediate add): ${config.procedures.filter(p => p.fields.length === 0).length}`);
