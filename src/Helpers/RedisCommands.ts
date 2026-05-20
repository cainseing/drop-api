// Atomically decrement reads, delete the key if exhausted, and return the JSON blob.
// Returns nil if the key doesn't exist or reads were already exhausted before this call.
const GET_AND_DECREMENT_LUA = `
local exists = redis.call('EXISTS', KEYS[1])
if exists == 0 then return nil end

local reads = redis.call('JSON.NUMINCRBY', KEYS[1], '$.reads', -1)
if not reads then return nil end

local decoded = cjson.decode(reads)
if not decoded or #decoded == 0 then return nil end

local newReads = decoded[1]
if newReads < 0 then
  redis.call('DEL', KEYS[1])
  return nil
end

local data = redis.call('JSON.GET', KEYS[1], '$')
if not data then return nil end

if newReads == 0 then redis.call('DEL', KEYS[1]) end

local obj = cjson.decode(data)
if not obj or #obj == 0 then return nil end

obj[1].reads = newReads
return cjson.encode(obj[1])
`;

export function registerCommands(redis: any): void {
    redis.defineCommand('getAndDecrement', { numberOfKeys: 1, lua: GET_AND_DECREMENT_LUA });
}
