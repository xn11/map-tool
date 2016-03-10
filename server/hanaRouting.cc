// hello.cc
#include <node.h>
#include <string>
#include <sstream> 

namespace demo {

	using v8::FunctionCallbackInfo;
	using v8::Isolate;
	using v8::Local;
	using v8::Object;
	using v8::String;
	using v8::Value;

	void Method(const FunctionCallbackInfo<Value>& args) {
		Isolate* isolate = args.GetIsolate();
		std::string str = "";

		for (int i = 0; i < args.Length(); i++){
  	// String tmp = v8::String::Cast(&args[i]);
			double tmp = args[i]->NumberValue();

			std::ostringstream os; 
			os.precision(10); 			//设置os转换string的精度为10
			if (os << tmp)  
				str = str + os.str() + ","; 
		}
		str = str.substr(0, str.length() - 1);

		char * cstr = new char [str.length()+1];
		std::strcpy (cstr, str.c_str());
		args.GetReturnValue().Set(String::NewFromUtf8(isolate, cstr));
	}

	void init(Local<Object> exports) {
		NODE_SET_METHOD(exports, "getJson", Method);
	}

	NODE_MODULE(addon, init)

}  // namespace demo