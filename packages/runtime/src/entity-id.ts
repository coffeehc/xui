/** 正 int64 实体 ID 的明确外部表示；调用方必须与后端使用同一编码。 */
export type EntityIdEncoding='decimal'|'hex';

/** 保留字符串精度，仅接受指定编码的规范表示，不猜测或转换其它格式。 */
export function parseEntityId(value:unknown,encoding:EntityIdEncoding='decimal'):string{
  if(encoding!=='decimal'&&encoding!=='hex')throw new TypeError('Invalid entity ID encoding');
  if(typeof value!=='string'||!(encoding==='decimal'?/^[1-9][0-9]{0,18}$/:/^[1-9a-f][0-9a-f]{0,15}$/).test(value)||BigInt(encoding==='hex'?`0x${value}`:value)>9223372036854775807n)throw new TypeError('Invalid entity ID');
  return value;
}
