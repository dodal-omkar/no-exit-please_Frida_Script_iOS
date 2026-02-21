/*
═══════════════════════════════════════════════════════════════
   no_exit_please_ios.js
   Universal Frida No-Exit Harness (Objective-C + Native)

   Purpose : Block application termination to enable
             reverse engineering and security analysis
   Author  : Slayer
   Version : 1.2
═══════════════════════════════════════════════════════════════
*/

'use strict';

/* =========================
 * Native-level hooks
 * ========================= */

function installNativeHooks() {

    function safeReplace(moduleName, symbol, ret, args, impl) {
        const addr = Module.findExportByName(moduleName, symbol);
        if (!addr) {
            console.log('[i] Native symbol not found:', symbol);
            return;
        }

        Interceptor.replace(addr, new NativeCallback(impl, ret, args));
        console.log('[+] Replaced native', symbol);
    }

    try {

        safeReplace(null, 'exit', 'void', ['int'], function (code) {
            console.log('[BLOCKED][Slayer] exit(' + code + ')');
        });

        safeReplace(null, '_exit', 'void', ['int'], function (code) {
            console.log('[BLOCKED][Slayer] _exit(' + code + ')');
        });

        safeReplace(null, 'abort', 'void', [], function () {
            console.log('[BLOCKED][Slayer] abort()');
        });

        safeReplace(null, 'kill', 'int', ['int', 'int'], function (pid, sig) {
            console.log('[BLOCKED][Slayer] kill(' + pid + ',' + sig + ')');
            return 0;
        });

        safeReplace(null, 'pthread_exit', 'void', ['pointer'], function (retval) {
            console.log('[BLOCKED][Slayer] pthread_exit()');
        });

        safeReplace(null, '__assert_rtn', 'void',
            ['pointer', 'pointer', 'int', 'pointer'],
            function (func, file, line, expr) {
                console.log('[BLOCKED][Slayer] __assert_rtn()');
            });

    } catch (e) {
        console.log('[-] Native hook error:', e);
    }
}

/* =========================
 * Objective-C hooks
 * ========================= */

function installObjCHooks() {

    if (!ObjC.available) {
        console.log('[-] Objective-C runtime not available');
        return;
    }

    try {

        // UIApplication terminateWithSuccess
        const UIApplication = ObjC.classes.UIApplication;
        if (UIApplication && UIApplication['- terminateWithSuccess']) {
            Interceptor.attach(
                UIApplication['- terminateWithSuccess'].implementation,
                {
                    onEnter: function () {
                        console.log('[BLOCKED][Slayer] UIApplication terminateWithSuccess');
                    }
                }
            );
        }

    } catch (e) {
        console.log('[i] UIApplication hook skipped');
    }

    try {

        // NSException raise
        const NSException = ObjC.classes.NSException;
        if (NSException && NSException['- raise']) {
            Interceptor.attach(
                NSException['- raise'].implementation,
                {
                    onEnter: function (args) {
                        const name = new ObjC.Object(args[0]).name().toString();
                        console.log('[BLOCKED][Slayer] NSException raise: ' + name);
                    }
                }
            );
        }

    } catch (e) {
        console.log('[i] NSException hook skipped');
    }

    try {

        // objc_exception_throw
        const objcThrow = Module.findExportByName(null, 'objc_exception_throw');
        if (objcThrow) {
            Interceptor.attach(objcThrow, {
                onEnter: function (args) {
                    try {
                        const ex = new ObjC.Object(args[0]);
                        console.log('[BLOCKED][Slayer] objc_exception_throw: ' + ex.$className);
                    } catch (_) {
                        console.log('[BLOCKED][Slayer] objc_exception_throw');
                    }
                }
            });
        }

    } catch (e) {
        console.log('[i] objc_exception_throw hook skipped');
    }

    console.log('[*] Objective-C no-exit hooks installed (Slayer)');
}

/* =========================
 * Deferred install
 * ========================= */

setImmediate(function () {

    if (typeof NativeCallback === 'function') {
        installNativeHooks();
    }

    installObjCHooks();

    console.log('[*] no_exit_please_ios.js fully loaded - Slayer');
});
