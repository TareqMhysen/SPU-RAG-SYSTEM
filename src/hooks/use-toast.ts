// استيراد React
// Import React
import * as React from "react";

// استيراد الأنواع المطلوبة
// Import required types
import type { ToastActionElement, ToastProps } from "@/components/ui/toast";

// الحد الأقصى لعدد الإشعارات المعروضة في نفس الوقت
// Maximum number of toasts to display at once
const TOAST_LIMIT = 1;
// التأخير قبل إزالة الإشعار (بالميلي ثانية)
// Delay before removing toast (in milliseconds)
const TOAST_REMOVE_DELAY = 5000;

// نوع الإشعار الكامل
// Full toast type
type ToasterToast = ToastProps & {
  id: string;  // معرف فريد - Unique identifier
  title?: React.ReactNode;  // العنوان - Title
  description?: React.ReactNode;  // الوصف - Description
  action?: ToastActionElement;  // الإجراء - Action
};

// أنواع الإجراءات للإشعارات
// Action types for toasts
const actionTypes = {
  ADD_TOAST: "ADD_TOAST",  // إضافة إشعار - Add toast
  UPDATE_TOAST: "UPDATE_TOAST",  // تحديث إشعار - Update toast
  DISMISS_TOAST: "DISMISS_TOAST",  // رفض إشعار - Dismiss toast
  REMOVE_TOAST: "REMOVE_TOAST",  // إزالة إشعار - Remove toast
} as const;

// عداد لتوليد المعرفات الفريدة
// Counter for generating unique IDs
let count = 0;

// دالة لتوليد معرف فريد
// Function to generate unique ID
function genId() {
  count = (count + 1) % Number.MAX_SAFE_INTEGER;
  return count.toString();
}

type ActionType = typeof actionTypes;

type Action =
  | {
      type: ActionType["ADD_TOAST"];
      toast: ToasterToast;
    }
  | {
      type: ActionType["UPDATE_TOAST"];
      toast: Partial<ToasterToast>;
    }
  | {
      type: ActionType["DISMISS_TOAST"];
      toastId?: ToasterToast["id"];
    }
  | {
      type: ActionType["REMOVE_TOAST"];
      toastId?: ToasterToast["id"];
    };

interface State {
  toasts: ToasterToast[];
}

// خريطة لتخزين المؤقتات للإشعارات
// Map to store timeouts for toasts
const toastTimeouts = new Map<string, ReturnType<typeof setTimeout>>();

// دالة لإضافة إشعار إلى قائمة الانتظار للإزالة
// Function to add toast to removal queue
const addToRemoveQueue = (toastId: string) => {
  // إذا كان الإشعار موجوداً بالفعل في قائمة الانتظار، لا تفعل شيئاً
  // If toast already in removal queue, do nothing
  if (toastTimeouts.has(toastId)) {
    return;
  }

  // إنشاء مؤقت لإزالة الإشعار بعد التأخير
  // Create timeout to remove toast after delay
  const timeout = setTimeout(() => {
    toastTimeouts.delete(toastId);
    dispatch({
      type: "REMOVE_TOAST",
      toastId: toastId,
    });
  }, TOAST_REMOVE_DELAY);

  // حفظ المؤقت في الخريطة
  // Store timeout in map
  toastTimeouts.set(toastId, timeout);
};

// دالة اختزال لإدارة حالة الإشعارات
// Reducer function to manage toast state
export const reducer = (state: State, action: Action): State => {
  switch (action.type) {
    case "ADD_TOAST":
      // إضافة إشعار جديد في بداية القائمة مع الحد الأقصى
      // Add new toast at the beginning of the list with limit
      return {
        ...state,
        toasts: [action.toast, ...state.toasts].slice(0, TOAST_LIMIT),
      };

    case "UPDATE_TOAST":
      // تحديث إشعار موجود
      // Update existing toast
      return {
        ...state,
        toasts: state.toasts.map((t) => (t.id === action.toast.id ? { ...t, ...action.toast } : t)),
      };

    case "DISMISS_TOAST": {
      const { toastId } = action;

      // ! تأثيرات جانبية ! - يمكن استخراجها إلى إجراء dismissToast()،
      // ! Side effects ! - This could be extracted into a dismissToast() action,
      // لكن سأبقيها هنا للبساطة
      // but I'll keep it here for simplicity
      if (toastId) {
        // إضافة إشعار محدد إلى قائمة الانتظار للإزالة
        // Add specific toast to removal queue
        addToRemoveQueue(toastId);
      } else {
        // إضافة جميع الإشعارات إلى قائمة الانتظار للإزالة
        // Add all toasts to removal queue
        state.toasts.forEach((toast) => {
          addToRemoveQueue(toast.id);
        });
      }

      // تحديث حالة الإشعارات لإغلاقها
      // Update toast state to close them
      return {
        ...state,
        toasts: state.toasts.map((t) =>
          t.id === toastId || toastId === undefined
            ? {
                ...t,
                open: false,
              }
            : t,
        ),
      };
    }
    case "REMOVE_TOAST":
      // إزالة إشعار من القائمة
      // Remove toast from list
      if (action.toastId === undefined) {
        // إذا لم يتم تحديد معرف، إزالة جميع الإشعارات
        // If no ID specified, remove all toasts
        return {
          ...state,
          toasts: [],
        };
      }
      // إزالة إشعار محدد
      // Remove specific toast
      return {
        ...state,
        toasts: state.toasts.filter((t) => t.id !== action.toastId),
      };
  }
};

// قائمة المستمعين لتحديثات الحالة
// List of listeners for state updates
const listeners: Array<(state: State) => void> = [];

// حالة الذاكرة للإشعارات
// Memory state for toasts
let memoryState: State = { toasts: [] };

// دالة لإرسال إجراء
// Function to dispatch action
function dispatch(action: Action) {
  // تحديث الحالة باستخدام دالة الاختزال
  // Update state using reducer function
  memoryState = reducer(memoryState, action);
  // إشعار جميع المستمعين بالتغيير
  // Notify all listeners of the change
  listeners.forEach((listener) => {
    listener(memoryState);
  });
}

// نوع الإشعار بدون المعرف
// Toast type without ID
type Toast = Omit<ToasterToast, "id">;

// دالة لإنشاء وإضافة إشعار
// Function to create and add toast
function toast({ ...props }: Toast) {
  // توليد معرف فريد
  // Generate unique ID
  const id = genId();

  // دالة لتحديث الإشعار
  // Function to update toast
  const update = (props: ToasterToast) =>
    dispatch({
      type: "UPDATE_TOAST",
      toast: { ...props, id },
    });
  // دالة لرفض الإشعار
  // Function to dismiss toast
  const dismiss = () => dispatch({ type: "DISMISS_TOAST", toastId: id });

  // إضافة الإشعار
  // Add toast
  dispatch({
    type: "ADD_TOAST",
    toast: {
      ...props,
      id,
      open: true,  // فتح الإشعار - Open toast
      onOpenChange: (open) => {
        // عند إغلاق الإشعار، رفضه
        // When toast closes, dismiss it
        if (!open) dismiss();
      },
    },
  });

  // إرجاع معرف الإشعار ودوال التحديث والرفض
  // Return toast ID and update/dismiss functions
  return {
    id: id,
    dismiss,
    update,
  };
}

// Hook لإدارة الإشعارات
// Hook to manage toasts
function useToast() {
  // حالة الإشعارات
  // Toast state
  const [state, setState] = React.useState<State>(memoryState);

  // إضافة المستمع عند التحميل وإزالته عند إلغاء التحميل
  // Add listener on mount and remove on unmount
  React.useEffect(() => {
    listeners.push(setState);
    return () => {
      const index = listeners.indexOf(setState);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    };
  }, [state]);

  // إرجاع الحالة ودالة إنشاء الإشعار ودالة الرفض
  // Return state, toast creation function, and dismiss function
  return {
    ...state,
    toast,
    dismiss: (toastId?: string) => dispatch({ type: "DISMISS_TOAST", toastId }),
  };
}

export { useToast, toast };
