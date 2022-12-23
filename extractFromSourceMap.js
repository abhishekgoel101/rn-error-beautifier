const StackTrace = require('stacktrace-js');
const SourceMap = require('source-map');

function resolveError(err, sourceCode, sourceMapCode) {
    // This will use sourcemaps and normalize the stack frames

    let sourceCache = {
        'main.jsbundle': sourceCode,
    };
    let sourceMap = sourceMapCode;
    let sourceMapConsumerCache = {
        'main.jsbundle.map': new SourceMap.SourceMapConsumer(sourceMap),
    };

    return StackTrace.fromError(err, { sourceCache, offline: true, sourceMapConsumerCache })
        .then((stack) => {
            var lines = [err.toString()];
            // Reconstruct to a JS stack frame as expected by Error Reporting parsers.
            for (var s = 0; s < stack.length; s++) {
                // Cannot use stack[s].source as it is not populated from source maps.
                lines.push(
                    [
                        '    at ',
                        // If a function name is not available '<anonymous>' will be used.
                        stack[s].getFunctionName() || '<anonymous>',
                        ' (',
                        stack[s].getFileName(),
                        ':',
                        stack[s].getLineNumber(),
                        ':',
                        stack[s].getColumnNumber(),
                        ')',
                    ].join('')
                );
            }
            return lines.join('\n');
        })
        .catch((reason) => {
            // Failure to extract stacktrace
            return [
                'Error extracting stack trace: ',
                reason,
                '\n',
                err.toString(),
                '\n',
                '    (',
                err.file,
                ':',
                err.line,
                ':',
                err.column,
                ')',
            ].join('');
        });
}

function getStackTrace() {
    let fs = require('fs'),
        path = require('path');

    let stackTraceFile = path.join('.', 'stacktrace.txt'); //input error file
    let sourceFile = path.join('../sharechat-ios/','Projects/ShareChatApp/Resources/Assets/ReactNative/CodePush', 'main.jsbundle');
    let sourceMapFile = path.join('../sharechat-ios/','Projects/ShareChatApp/Resources/Assets/ReactNative/CodePush', 'main.jsbundle.map');

    let minifiedStackTrace = fs.readFileSync(stackTraceFile).toString();
    let sourceCode = fs.readFileSync(sourceFile).toString();
    let sourceMapCode = fs.readFileSync(sourceMapFile).toString();

    const tempError = new Error('Temp Error');
    tempError.stack = minifiedStackTrace;

    resolveError(tempError, sourceCode, sourceMapCode).then((formattedStackTrace) => {
        console.log('Formatted Stack Trace \n ', formattedStackTrace);
    });
    return null;
}

getStackTrace();

