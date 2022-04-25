let members = ["1", "2", "3", "4", "5"]

function addToGroup(groups, item) {
    let minLength = -1;
    let idx = -1;
    for (let index = 0; index < groups.length; index++) {
        const element = groups[index];
        if (minLength == -1 || element.length < minLength) {
            minLength = element.length;
            idx = index;
        }
    }

    groups[idx].push(item);
}

function addItemsToGroup(groups, items) {
    items.forEach(i => addToGroup(groups, i));
}

function newDraw(members, previousDraw, groupSize) {
    const groups = [];
    const numGroups = Math.trunc(members.length / groupSize);
    for (let index = 0; index < numGroups; index++) {
        groups.push([]);
    }
    let previousMembers = [];
    let pool = [];
    previousDraw.forEach(pair => {
        previousMembers = previousMembers.concat(pair);
        const newPair = pair.filter(p => members.indexOf(p) != -1);
        if (newPair.length != pair.length)
            pool = pool.concat(newPair);
        else
            addItemsToGroup(groups, newPair);
    });
    pool = pool.concat(members.filter(i => previousMembers.indexOf(i) == -1));
    addItemsToGroup(groups, pool);
    console.log(groups);
    return groups;
}

lastDraw = newDraw(members, newDraw(members, newDraw(members, newDraw(members, newDraw(members, [], 2), 2), 2), 2), 2);
members.push("6");
lastDraw = newDraw(members, lastDraw, 2);
members.push("7");
lastDraw = newDraw(members, lastDraw, 2);
members = ["2", "3", "5", "7"];
lastDraw = newDraw(members, lastDraw, 2);
members = ["2", "3", "5"];
lastDraw = newDraw(members, lastDraw, 2);