const { existsSync } = require('fs');
const { resolve: pathResolve } = require('path');
const { pathToFileURL, URL } = require('url');
const { DANGEROUS_PROTOCOLS, DEFAULT_ALLOWED_PROTOCOLS } = require('./constants');

const resolveTarget = (target) => {
  if (typeof target === 'string' && existsSync(target)) {
    return pathToFileURL(pathResolve(target)).href;
  }
  return target;
};

const validateUrl = (target, options = {}) => {
  if (typeof target !== 'string' || !target.trim()) {
    return {
      valid: false,
      target,
      error: 'Target must be a non-empty string.',
    };
  }

  const trimmed = target.trim();
  const allowLocal = options.allowLocal !== false;
  const allowedProtocols = options.allowedProtocols || DEFAULT_ALLOWED_PROTOCOLS;

  const schemeMatch = trimmed.match(/^([a-zA-Z][a-zA-Z0-9+.-]*):/);
  if (schemeMatch) {
    const scheme = schemeMatch[1].toLowerCase();
    const fullScheme = `${scheme}:`;
    if (DANGEROUS_PROTOCOLS.has(fullScheme)) {
      return {
        valid: false,
        target: trimmed,
        protocol: fullScheme,
        error: `Dangerous or unsupported protocol: ${fullScheme}`,
      };
    }
  }

  if (existsSync(trimmed)) {
    if (!allowLocal) {
      return {
        valid: false,
        target: trimmed,
        error: 'Local file targets are not permitted by options.',
      };
    }
    const fileUrl = pathToFileURL(pathResolve(trimmed)).href;
    return {
      valid: true,
      target: trimmed,
      url: fileUrl,
      protocol: 'file:',
      isLocal: true,
    };
  }

  try {
    const parsed = new URL(trimmed);
    const protocol = parsed.protocol.toLowerCase();

    if (DANGEROUS_PROTOCOLS.has(protocol)) {
      return {
        valid: false,
        target: trimmed,
        protocol,
        error: `Dangerous or unsupported protocol: ${protocol}`,
      };
    }

    if (!allowedProtocols.includes(protocol)) {
      return {
        valid: false,
        target: trimmed,
        protocol,
        error: `Protocol "${protocol}" is not allowed. Allowed protocols: ${allowedProtocols.join(', ')}`,
      };
    }

    if ((protocol === 'http:' || protocol === 'https:') && !parsed.hostname) {
      return {
        valid: false,
        target: trimmed,
        protocol,
        error: 'Web URLs must include a valid hostname.',
      };
    }

    return {
      valid: true,
      target: trimmed,
      url: parsed.href,
      protocol,
      isLocal: protocol === 'file:',
    };
  } catch (err) {
    if (allowLocal) {
      const looksLikePath = trimmed.startsWith('./')
        || trimmed.startsWith('../')
        || trimmed.startsWith('/')
        || trimmed.startsWith('~')
        || /^[a-zA-Z]:[\\/]/.test(trimmed);

      if (looksLikePath) {
        return {
          valid: true,
          target: trimmed,
          url: pathToFileURL(pathResolve(trimmed)).href,
          protocol: 'file:',
          isLocal: true,
        };
      }
    }

    return {
      valid: false,
      target: trimmed,
      error: `Invalid URL format: ${err.message}`,
    };
  }
};

module.exports = {
  resolveTarget,
  validateUrl,
};
