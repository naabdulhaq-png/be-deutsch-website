// Exact learner-route exception; other Review/private directories remain forbidden.
export function forbiddenBuildPath(relative) {
 const p=relative.replaceAll('\\','/');
 if(p==='a2/unit-1/review/index.html')return false;
 return /(?:^|\/)(?:preview-[^/]*|node_modules|src|Review|Screenshots|backups?|rejected)(?:\/|$)|\.(?:zip|xlsx|map|pem|key)$|\/\.env(?:\.|$)|^\.env(?:\.|$)/i.test(p);
}
