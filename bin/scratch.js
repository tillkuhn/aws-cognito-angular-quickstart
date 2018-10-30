// https://stackoverflow.com/questions/18017869/build-tree-array-from-flat-array-in-javascript
var rootCode = 'www';

unflatten = function (array, parent, tree) {

    tree = typeof tree !== 'undefined' ? tree : [];
    parent = typeof parent !== 'undefined' ? parent : {code: rootCode};

    var children = array.filter(function (child) {
        return child.parentCode == parent.code;
    });

    if (children && children.length > 0)  {
        if (parent.code == rootCode) {
            tree = children;
        } else {
            parent['children'] = children;
        }
        children.forEach(function (child) {
            unflatten(array, child)
        });
    } else {
        parent['children'] = [];
    }

    return tree;
}

var hase = [
    {'code': 'de', 'parentCode': 'eu'},
    {'code': 'fr', 'parentCode': 'eu'},
    {'code': 'it', 'parentCode': 'eu'},
    {'code': 'th', 'parentCode': 'asia'},
    {'code': 'th-golf', 'parentCode': 'th'},
    {'code': 'th-north', 'parentCode': 'th'},
    {'code': 'vn', 'parentCode': 'asia'},
    {'code': 'eu', 'parentCode': rootCode},
    {'code': 'asia', 'parentCode': rootCode}
];

console.log(JSON.stringify(unflatten(hase),null,4));
