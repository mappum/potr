'use strict'

function protect (value, parent) {
  function protectedTrap (method) {
    return (...args) => {
      let returnValue = method(...args)
      return protect(returnValue, proxy)
    }
  }

  function throwReadOnlyError () {
    throw Error('Protected object is read-only')
  }

  // primitives get passed through
  if (Object(value) !== value) {
    return value
  }

  // wrap functions with in-Realm function,
  // with protected parent object as 'this'
  if (typeof value === 'function') {
    let original = value
    value = (...args) => {
      // protect the return value
      let returnValue = original.apply(parent, args)
      return protect(returnValue)
    }
  }

  // wrap with in-Realm Proxy,
  // which protects values returned by accesses,
  // and errors when trying to modify
  let proxy = new Proxy(value, {
    // accesses
    get: protectedTrap(Reflect.get),
    getPrototypeOf: protectedTrap(Reflect.getPrototypeOf),
    isExtensible: protectedTrap(Reflect.isExtensible),
    getOwnPropertyDescriptor: protectedTrap(Reflect.getOwnPropertyDescriptor),
    has: protectedTrap(Reflect.has),
    ownKeys: protectedTrap(Reflect.ownKeys),
    apply: protectedTrap(Reflect.apply),
    construct: protectedTrap(Reflect.construct),

    // modifications
    set: throwReadOnlyError,
    setPrototypeOf: throwReadOnlyError,
    preventExtensions: throwReadOnlyError,
    defineProperty: throwReadOnlyError,
    deleteProperty: throwReadOnlyError
  })

  return proxy
}

module.exports = protect
