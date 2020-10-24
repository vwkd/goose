import { log } from "../logger.ts";
import { pathJoin, pathRelative, pathParse, pathExtname, pathSeparator, pathBasename, walk } from "../deps.ts";
import type { BaseFile, FileList } from "../types.ts";

// todo: desc
export async function loadFileList({
    source,
    target,
    ignoredFilename,
    ignoredDirname,
    layoutDirname,
    dataDirname
}: {
    source: string;
    target: string;
    ignoredFilename: string;
    ignoredDirname: string;
    layoutDirname: string;
    dataDirname: string;
}): Promise<FileList> {
    const templatesBase: BaseFile[] = [];
    const assetsBase: BaseFile[] = [];
    const ignoredBase: BaseFile[] = [];
    const layoutsBase: BaseFile[] = [];
    const globalsBase: BaseFile[] = [];

    for await (const item of walk(source, { includeDirs: false })) {
        const file = makeFile(source, target, item.path);

        if (file.sourceName.startsWith(ignoredFilename)) {
            log.trace(`File is ignored because of filename: ${item.path}`);
            ignoredBase.push(file);
        } else if (file.sourceDirectoryRelativeFirstSegment == layoutDirname) {
            if (file.sourceDirectoryRelativeRestSegmentArr.some(str => str.startsWith(ignoredDirname))) {
                log.trace(`File is ignored because of directory name: ${item.path}`);
                ignoredBase.push(file);
            } else {
                log.trace(`File is layout because of directory name: ${item.path}`);
                layoutsBase.push(file);
            }
        } else if (file.sourceDirectoryRelativeFirstSegment == dataDirname) {
            if (file.sourceDirectoryRelativeRestSegmentArr.some(str => str.startsWith(ignoredDirname))) {
                log.trace(`File is ignored because of directory name: ${item.path}`);
                ignoredBase.push(file);
            } else {
                log.trace(`File is global data because of directory name: ${item.path}`);
                globalsBase.push(file);
            }
        }

        // after check for dataDirectory and layoutDirectory such that they can use ignoredFilename
        else if (file.sourceDirectory.split(pathSeparator).some(str => str.startsWith(ignoredDirname))) {
            log.trace(`File is ignored because of directory name: ${item.path}`);
            ignoredBase.push(file);
        } else if (file.sourceExtension == ".js") {
            if (file.sourceExtensionSecond) {
                log.trace(
                    `File is template because of double "${file.sourceExtensionSecond}.js" extension: ${item.path}`
                );
                templatesBase.push(file);
            } else {
                log.trace(`File is asset because of single ".js" extension: ${item.path}`);
                assetsBase.push(file);
            }
        }

        // everything else
        else {
            log.trace(`File is asset because everything else: ${item.path}`);
            assetsBase.push(file);
        }
    }

    return { assetsBase, globalsBase, layoutsBase, templatesBase, ignoredBase };
}

/**
 * Splits path into its constituents
 * path = dir + name + ext
 *      = root + dirRel + name + ext
 * @param path path to split
 * @returns object with root, dirRel, name and ext properties
 */
function splitPath(path: string): { root: string; dirRel: string; name: string; ext: string } {
    const { root, dir, name, ext } = pathParse(path);
    return { root: root, dirRel: pathRelative(root, dir), name: name, ext: ext };
}

/**
 * Builds file object. Setting any property updates all others.
 * targetPath is initialised to same relative path in target as sourcePath is in source
 * source/targetPath/Directory are stripped of leading root segment
 * TODO: Make sure source and target don't start with pathSeparator, otherwise xDirectory/PathRelative will be absolute, and break xPath/DirectoryRelative*Segment()
 * 
 * TODO: Make sure xPath/DirectoryRelative isn't set with an absolute path, otherwise if source and target are empty, this will break xPath/DirectoryRelative*Segment()
 * also strips trailing `.js` extension on targetPath if has double extension
 * @param source path of source directory
 * @param target path of target directory
 * @param sourcePath path of file
 * beware: if makes copy of object loses the dynamic behavior, e.g. using newFile = {...file}
 */
// todo: relax constraint of return type
// todo: check when uses sourcePath/Directory without subtracting root first, e.g. in computation of sourcePath/DirectoryRelative...
function makeFile(source: string, target: string, sourcePath: string): Readonly<BaseFile> {
    // dir_*, name_*, ext_* hold data, will be used by getter and setters

    let { dirRel: dirRel_s, name: name_s, ext: ext_s } = splitPath(sourcePath);

    let dirRel_t = pathJoin(target, pathRelative(source, dirRel_s));
    let name_t = name_s;
    let ext_t = ext_s;

    // strip trailing `.js` extension on targetPath if has double extension
    const extSec_s = pathExtname(name_s);
    if (extSec_s) {
        name_t = pathBasename(name_t, extSec_s);
        ext_t = extSec_s;
    }

    return {
        // ------ source path -------

        get sourcePath() {
            return pathJoin(dirRel_s, name_s + ext_s);
        },

        set sourcePath(val) {
            const { dirRel: _dirRel, name: _name, ext: _ext } = splitPath(val);
            dirRel_s = _dirRel;
            name_s = _name;
            ext_s = _ext;
        },

        get sourcePathRelative() {
            return pathRelative(source, this.sourcePath);
        },

        set sourcePathRelative(val) {
            this.sourcePath = pathJoin(source, val);
        },

        get sourceDirectory() {
            return dirRel_s;
        },

        set sourceDirectory(val) {
            const { dirRel: _dirRel } = splitPath(val);
            dirRel_s = _dirRel;
        },

        get sourceDirectoryRelative() {
            return pathRelative(source, this.sourceDirectory);
        },

        set sourceDirectoryRelative(val) {
            this.sourceDirectory = pathJoin(source, val);
        },

        get sourceBase() {
            return name_s + ext_s;
        },

        set sourceBase(val) {
            const { name: _name, ext: _ext } = pathParse(val);
            name_s = _name;
            ext_s = _ext;
        },

        get sourceName() {
            return name_s;
        },

        set sourceName(val) {
            name_s = val;
        },

        get sourceExtension() {
            return ext_s;
        },

        set sourceExtension(val) {
            ext_s = val;
        },

        // only used for files in top-level data or layout directory
        // TODO: Make sure source and target don't start with pathSeparator, otherwise xDirectory/PathRelative will be absolute, and break xPath/DirectoryRelative*Segment()
        // TODO: Make sure xPath/DirectoryRelative isn't set with an absolute path, otherwise if source and target are empty, this will break xPath/DirectoryRelative*Segment()
        get sourcePathRelativeRestSegment() {
            const [first, ...restArr] = this.sourcePathRelative.split(pathSeparator);
            return restArr.join(pathSeparator);
        },

        // only used for files in top-level data or layout directory
        // TODO: Make sure source and target don't start with pathSeparator, otherwise xDirectory/PathRelative will be absolute, and break xPath/DirectoryRelative*Segment()
        // TODO: Make sure xPath/DirectoryRelative isn't set with an absolute path, otherwise if source and target are empty, this will break xPath/DirectoryRelative*Segment()
        get sourceDirectoryRelativeFirstSegment() {
            const [first, ...restArr] = this.sourceDirectoryRelative.split(pathSeparator);
            return first;
        },

        // only used for files in top-level data or layout directory
        // TODO: Make sure source and target don't start with pathSeparator, otherwise xDirectory/PathRelative will be absolute, and break xPath/DirectoryRelative*Segment()
        // TODO: Make sure xPath/DirectoryRelative isn't set with an absolute path, otherwise if source and target are empty, this will break xPath/DirectoryRelative*Segment()
        get sourceDirectoryRelativeRestSegmentArr() {
            const [first, ...restArr] = this.sourceDirectoryRelative.split(pathSeparator);
            return restArr;
        },

        get sourceExtensionSecond() {
            // because name ends on second extension if ext is first extension
            // note: pathExtname returns empty string if single "." is first character, i.e. a nameless files like ".css.js" or ". .js" or "..js" are handled as asset
            // is empty string if doesn't find anything
            return pathExtname(this.sourceName);
        },

        // ------ target path -------

        get targetPath() {
            return pathJoin(dirRel_t, name_t + ext_t);
        },

        set targetPath(val) {
            const { dirRel: _dirRel, name: _name, ext: _ext } = splitPath(val);
            dirRel_t = _dirRel;
            name_t = _name;
            ext_t = _ext;
        },

        get targetPathRelative() {
            return pathRelative(target, this.targetPath);
        },

        set targetPathRelative(val) {
            this.targetPath = pathJoin(target, val);
        },

        get targetDirectory() {
            return dirRel_t;
        },

        set targetDirectory(val) {
            const { dirRel: _dirRel } = splitPath(val);
            dirRel_t = _dirRel;
        },

        get targetDirectoryRelative() {
            return pathRelative(target, this.targetDirectory);
        },

        set targetDirectoryRelative(val) {
            this.targetDirectory = pathJoin(target, val);
        },

        get targetBase() {
            return name_t + ext_t;
        },

        set targetBase(val) {
            const { name: _name, ext: _ext } = pathParse(val);
            name_t = _name;
            ext_t = _ext;
        },

        get targetName() {
            return name_t;
        },

        set targetName(val) {
            name_t = val;
        },

        get targetExtension() {
            return ext_t;
        },

        set targetExtension(val) {
            ext_t = val;
        }

        /*         // only used for files in top-level data or layout directory
        // TODO: Make sure source and target don't start with pathSeparator, otherwise xDirectory/PathRelative will be absolute, and break xPath/DirectoryRelative*Segment()
        // TODO: Make sure xPath/DirectoryRelative isn't set with an absolute path, otherwise if source and target are empty, this will break xPath/DirectoryRelative*Segment()
        get targetDirectoryRelativeFirstSegment() {
            const [first, ...restArr] = this.targetDirectoryRelative.split(pathSeparator);
            return first;
        },

        // only used for files in top-level data or layout directory
        // TODO: Make sure source and target don't start with pathSeparator, otherwise xDirectory/PathRelative will be absolute, and break xPath/DirectoryRelative*Segment()
        // TODO: Make sure xPath/DirectoryRelative isn't set with an absolute path, otherwise if source and target are empty, this will break xPath/DirectoryRelative*Segment()
        get targetDirectoryRelativeRestSegment() {
            const [first, ...restArr] = this.targetDirectoryRelative.split(pathSeparator);
            return restArr.join(pathSeparator);
        }

        // only used for files in top-level data or layout directory
        // TODO: Make sure source and target don't start with pathSeparator, otherwise xDirectory/PathRelative will be absolute, and break xPath/DirectoryRelative*Segment()
        // TODO: Make sure xPath/DirectoryRelative isn't set with an absolute path, otherwise if source and target are empty, this will break xPath/DirectoryRelative*Segment()
        get targetDirectoryRelativeRestSegmentArr() {
            const [first, ...restArr] = this.targetDirectoryRelative.split(pathSeparator);
            return restArr;
        } */
    };
}
