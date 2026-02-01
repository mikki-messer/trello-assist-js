function formatCardTitle(projectName, number, currentTitle) {
    //removing old prefix, if exists
    const cleanTitle = currentTitle.replace(/^[A-Z]+-\d+\s+/, '');

    //if cleanTitle is empty
    if (!cleanTitle) {
        return `${projectName}-${number}`;
    }

    //adding new prefix
    return `${projectName}-${number} ${cleanTitle}`;
}

module.exports = {
    formatCardTitle
}