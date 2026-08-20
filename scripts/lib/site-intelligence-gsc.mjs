function text(value){ return String(value??'').trim(); }
function number(value){ const parsed=Number.parseFloat(String(value??'').replace(/,/g,'')); return Number.isFinite(parsed)?parsed:0; }
export function parseGscCtr(value,{unit='auto'}={}){
  const raw=text(value); if(!raw)return 0;
  const hasPercent=raw.includes('%'); const n=number(raw.replace('%',''));
  const resolved=unit==='auto'?(hasPercent?'percent':'ratio'):unit;
  const ratio=resolved==='percent'?n/100:n;
  if(ratio<0||ratio>1) throw new Error(`GSC CTR must resolve to a ratio between 0 and 1; received ${value}.`);
  return ratio;
}
export function classifyGscMetrics({clicks=0,impressions=0,ctr=0,position=null}={}){
  const c=number(clicks), i=number(impressions), r=parseGscCtr(ctr,{unit:'ratio'}), p=position===null||position===undefined||text(position)===''?null:number(position);
  if(c>=10&&r>=0.03&&p!==null&&p<=10)return 'Protect and expand';
  if(i>=100&&p!==null&&p<=12&&r<0.02)return 'Improve title and description';
  if(i>=50&&p!==null&&p>12&&p<=30)return 'Strengthen content and internal links';
  if(i>=20&&p!==null&&p>30)return 'Reassess intent or consolidate';
  if(i===0)return 'No Search Console signal';
  return 'Monitor';
}
export function priorityForGscAction(action){
  if(['Improve title and description','Strengthen content and internal links','Review keyword ownership / cannibalization'].includes(action))return 'P0';
  if(['Reassess intent or consolidate','Protect and expand','Review unmapped article URL','Review language-scoped Owner mapping'].includes(action))return 'P1';
  return 'P2';
}
export function classifyWarehouseObservation(row){
  const pagePath=text(row.page_path??row.pagePath);
  const storedStatus=text(row.owner_status??row.ownerStatus);
  const metadata=row.metadata&&typeof row.metadata==='object'?row.metadata:{};
  const reason=text(metadata.ownerMappingReason);
  const ownerStatus=reason==='owner-language-unmapped'?'owner-language-unmapped':({matched:'owner-match',mismatch:'owner-mismatch',unowned:'owner-unowned',unmapped:'owner-unmapped',not_evaluated:'not_evaluated'}[storedStatus]??storedStatus);
  let action=classifyGscMetrics({clicks:row.clicks,impressions:row.impressions,ctr:row.ctr,position:row.position});
  if(ownerStatus==='owner-mismatch') action='Review keyword ownership / cannibalization';
  else if(ownerStatus==='owner-language-unmapped') action='Review language-scoped Owner mapping';
  else if(!row.asset_id&&!row.assetId&&(pagePath.startsWith('/blog/')||pagePath.startsWith('/en/blog/'))) action='Review unmapped article URL';
  return {
    pagePath,
    query:text(row.query),
    clicks:number(row.clicks),
    impressions:number(row.impressions),
    ctr:parseGscCtr(row.ctr,{unit:'ratio'}),
    position:row.position===null||row.position===undefined?null:number(row.position),
    ownerKeyword:text(row.owner_keyword??row.ownerKeyword)||null,
    ownerStatus:ownerStatus||null,
    expectedOwnerHref:text(row.expected_owner_href??row.expectedOwnerHref)||null,
    mappingSource:'gsc-historical-warehouse',
    priority:priorityForGscAction(action),
    action,
    sourceImportId:text(row.source_import_id??row.sourceImportId)||null,
    periodStart:text(row.period_start??row.periodStart)||null,
    periodEnd:text(row.period_end??row.periodEnd)||null,
  };
}
export function formatGscCtr(ratio){ return `${(parseGscCtr(ratio,{unit:'ratio'})*100).toFixed(2)}%`; }

export function resolveGscSource({ fileInput = null, databaseConnected = false, requested = null } = {}){
  const mode=text(requested).toLowerCase();
  if(mode && !['file','warehouse','none'].includes(mode)) throw new Error(`Invalid GSC source: ${requested}`);
  if(mode==='file' && !text(fileInput)) throw new Error('GSC source=file requires --gsc.');
  if(mode==='warehouse' && !databaseConnected) throw new Error('GSC source=warehouse requires DATABASE_URL.');
  if(mode) return mode;
  if(text(fileInput)) return 'file';
  if(databaseConnected) return 'warehouse';
  return 'none';
}
