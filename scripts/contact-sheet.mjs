import sharp from 'sharp';
import {PDFDocument} from 'pdf-lib';import{readFile}from'node:fs/promises';
const doc=await PDFDocument.load(await readFile('test-results/contrato-teste.pdf'));
const tiles=[];for(let i=1;i<=doc.getPageCount();i++){tiles.push({input:await sharp(`test-results/pdf-page-${i}.png`).resize(417,590).toBuffer(),left:((i-1)%2)*437,top:Math.floor((i-1)/2)*610});}
await sharp({create:{width:874,height:Math.ceil(doc.getPageCount()/2)*610,channels:3,background:'#dddddd'}}).composite(tiles).png().toFile('test-results/pdf-review.png');
