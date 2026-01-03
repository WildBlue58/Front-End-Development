import { useState, useEffect } from "react";

function DataForm({ tableName, columns, initialData, onSubmit, onCancel }) {
  const [formData, setFormData] = useState({});
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    } else {
      // 初始化表单数据
      const initial = {};
      columns.forEach((col) => {
        if (!col.EXTRA.includes("auto_increment")) {
          initial[col.COLUMN_NAME] = col.COLUMN_DEFAULT || "";
        }
      });
      setFormData(initial);
    }
  }, [initialData, columns]);

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // 清除该字段的错误
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const validate = () => {
    const newErrors = {};
    columns.forEach((col) => {
      const value = formData[col.COLUMN_NAME];
      if (col.IS_NULLABLE === "NO" && !col.EXTRA.includes("auto_increment")) {
        if (value === "" || value === null || value === undefined) {
          newErrors[col.COLUMN_NAME] = `${col.COLUMN_NAME} 是必填项`;
        }
      }
    });
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validate()) {
      onSubmit(formData);
    }
  };

  const renderInput = (col) => {
    const value = formData[col.COLUMN_NAME] ?? "";
    const isRequired =
      col.IS_NULLABLE === "NO" && !col.EXTRA.includes("auto_increment");
    const isReadonly = col.EXTRA.includes("auto_increment");

    if (isReadonly) {
      return (
        <input
          type="text"
          value={value}
          readOnly
          className="input-base bg-white/5 text-slate-500 cursor-not-allowed border-transparent"
          placeholder="自动生成"
        />
      );
    }

    const dataType = col.DATA_TYPE.toLowerCase();
    if (
      dataType === "text" ||
      dataType === "longtext" ||
      dataType === "mediumtext"
    ) {
      return (
        <textarea
          value={value}
          onChange={(e) => handleChange(col.COLUMN_NAME, e.target.value)}
          className="input-base min-h-[100px] resize-y"
          required={isRequired}
          rows={4}
        />
      );
    } else if (dataType === "date") {
      return (
        <input
          type="date"
          value={value}
          onChange={(e) => handleChange(col.COLUMN_NAME, e.target.value)}
          className="input-base"
          required={isRequired}
        />
      );
    } else if (dataType === "datetime" || dataType === "timestamp") {
      return (
        <input
          type="datetime-local"
          value={value}
          onChange={(e) => handleChange(col.COLUMN_NAME, e.target.value)}
          className="input-base"
          required={isRequired}
        />
      );
    } else if (
      dataType === "tinyint" &&
      col.COLUMN_TYPE.includes("tinyint(1)")
    ) {
      return (
        <select
          value={value}
          onChange={(e) => handleChange(col.COLUMN_NAME, e.target.value)}
          className="input-base"
          required={isRequired}
        >
          <option value="">请选择</option>
          <option value="1">是</option>
          <option value="0">否</option>
        </select>
      );
    } else {
      return (
        <input
          type="text"
          value={value}
          onChange={(e) => handleChange(col.COLUMN_NAME, e.target.value)}
          className="input-base"
          required={isRequired}
          placeholder={isRequired ? "必填" : "可选"}
        />
      );
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <div className="flex flex-col gap-5 max-h-[60vh] overflow-y-auto pr-2 pb-2">
        {columns.map((col) => {
          if (col.EXTRA.includes("auto_increment") && !initialData) {
            return null; // 新增时不显示自增字段
          }
          return (
            <div key={col.COLUMN_NAME} className="flex flex-col gap-2">
              <label className="text-slate-400 text-sm font-medium flex items-baseline gap-2">
                {col.COLUMN_NAME}
                {col.IS_NULLABLE === "NO" &&
                  !col.EXTRA.includes("auto_increment") && (
                    <span className="text-red-500 font-bold">*</span>
                  )}
                <span className="text-slate-500 text-xs font-normal bg-white/5 px-1.5 py-px rounded">
                  ({col.DATA_TYPE})
                </span>
              </label>
              {renderInput(col)}
              {errors[col.COLUMN_NAME] && (
                <span className="text-red-400 text-xs flex items-center gap-1 mt-1 font-medium">
                  <span className="inline-block w-3.5 h-3.5 leading-[14px] text-center rounded-full bg-red-400 text-white text-[10px] font-bold">
                    !
                  </span>
                  {errors[col.COLUMN_NAME]}
                </span>
              )}
            </div>
          );
        })}
      </div>
      <div className="flex justify-end gap-4 pt-6 border-t border-white/10">
        <button type="button" onClick={onCancel} className="btn btn-secondary">
          取消
        </button>
        <button type="submit" className="btn btn-primary">
          {initialData ? "更新" : "创建"}
        </button>
      </div>
    </form>
  );
}

export default DataForm;
