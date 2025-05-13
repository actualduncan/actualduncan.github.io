# UE Reflection System
## Notes
> Reflection is the ability of a program to examine itself at runtime. - Michael Noland

## Reflection System Overview

### Notes from UE4 Reflection blog
#### Notes
C++ doesn't natively support any form of reflection system.
Unreal 
- Harvests
- queries
- and manipulates info
Reflection system is often referred to as the "property system" - although I've only ever heard anyone call it the reflection system anyways..

[[Unreal Header Tool]] (UHT) is in-charge of harvesting types and classes marked with `UPROPERTY` `USTRUCT` `UCLASS` etc.. on compile time (you may notice this happening)

When including `#include "FileName.generated.h` in the header file of a class this tells UHT that this file should be considered by the reflection system and marks that this header will/contain reflected types.

To mark C++ types to the reflection system you can use `UENUM()` `UCLASS()` `USTRUCT()` `UFUNCTION()` and `UPROPERTY` to do as such.

When using `USTRUCT()` or `UCLASS()` macros on C++ class and structs the `GENERATED_UCLASS_BODY()`/ `GENERATED_USTRUCT_BODY()` macros are **required** in the body of the struct/class  — this is because  additional functions and typedefs are injected.

It is always ok to mix reflected and non-reflected properties in the same class, non-reflected types will not work with systems relying on reflection (anything UObject)

DO NOT STORE UNREFLECTED UOBJECT POINTERS — The [[UE Garbage Collection]] system will not be aware of the reference and can cause a memory leak.

`ObjectMacros.h` has documentation on meaning and usage of specifier keywords used within reflection system properties.

#### Limitations
- UHT only pays attention to reflected types, functions and properties.
- Try not to use `#if/#ifdef` around annotated properties or functions - can cause compile errors (UE4)
- Only a few template types are supported e.g `TArray` and `TSubclassOf` - can't be nested types. (UHT will give an error message if a type cannot be represented by the reflection system)

#### Advanced
Useful for writing your own tool code
Type Hierarchy for the reflection system.
```
UField
	UStruct
		UClass (C++ class)
		UScriptStruct (C++ struct)
		UFunction (C++ function)

	UEnum (C++ enumeration)

	UProperty (C++ member variable or function parameter)
```

UClass or UScriptStruct can be get with `UTypeName::StaticClass()` or `FTypeName::StaticStruct`. You can get the type for a UObject instance using `Instance->GetClass()` (this cannot be done with structs)

Use `TFieldIterator<UProperty>` to iterate over members of a UStruct - Since UClass inherits from UStruct this means any reflected class or Struct.

Example:
```
for (TFieldIterator<UProperty> PropIt(GetClass()); PropIt; ++PropIt)
{
	UProperty* Property = *PropIt;
	// Do something with the property
}
```

By specifying the type in `<>` you can filter between properties and functions using UField.

Potential opportunities when using reflection data:
- Enumerating properties
- Getting & Setting values in a data-driven manner?
- Invoking reflected functions
- Constructing new objects
`UnrealType.h / Class.h` can have example code for this?

####  How It Works
1. [[Unreal Build Tool]] (UBT) and [[Unreal Header Tool]] (UHT) work together to generate data needed to power runtime reflection
	1. UBT scans headers and remembers any modules that contain at least one reflected types
	2. If any headers have changed since the last compilation UHT harvests and updates reflection data
	3. UHT parses headers, builds up reflection data and then generates C++ code containing the reflected data (`per-module.generated.inl` & `per-header-generated.h)
##  Deep Dive
Luckily someone has done this for us already :) <- WRONG!
Example code:
```cpp
// MyActor.h

#include "MyActor.generated.h"

UCLASS()
class MY_API AMyActor : public AActor
{
GENERATED_BODY()
public:
	AMyActor();
	virtual void BeginPlay() override;

	UFUNCTION()
	void MyFunction();

	UPROPERTY()
	TObjectPtr<UObject> MyVariable;
};

```
`GENERATED_BODY`, `UFUNCTION()`, `UPROPERTY()` are all ignored by the C++ compiler and are used as markers for UHT to generate C++ code to inject.
```cpp
// MyActor.generated.h


```
## References
[Unreal Property System (Reflection)](https://www.unrealengine.com/en-US/blog/unreal-property-system-reflection)
[Reflection System in Unreal Engine | Unreal Engine 5.5 Documentation | Epic Developer Community](https://dev.epicgames.com/documentation/en-us/unreal-engine/reflection-system-in-unreal-engine)
[Unreal Object Handling in Unreal Engine | Unreal Engine 5.5 Documentation | Epic Developer Community](https://dev.epicgames.com/documentation/en-us/unreal-engine/unreal-object-handling-in-unreal-engine)
[A peek at Unreal Engine 4's reflection system: Part 1 - Introduction | Giang Tong](https://tongtunggiang.com/2021/ue-reflection1/)