import { useState, useEffect } from "react";
import "./DataForm.css";

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
          className="form-input form-input-readonly"
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
          className="form-textarea"
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
          className="form-input"
          required={isRequired}
        />
      );
    } else if (dataType === "datetime" || dataType === "timestamp") {
      return (
        <input
          type="datetime-local"
          value={value}
          onChange={(e) => handleChange(col.COLUMN_NAME, e.target.value)}
          className="form-input"
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
          className="form-select"
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
          className="form-input"
          required={isRequired}
          placeholder={isRequired ? "必填" : "可选"}
        />
      );
    }
  };

  return (
    <form onSubmit={handleSubmit} className="data-form">
      <div className="form-fields">
        {columns.map((col) => {
          if (col.EXTRA.includes("auto_increment") && !initialData) {
            return null; // 新增时不显示自增字段
          }
          return (
            <div key={col.COLUMN_NAME} className="form-field">
              <label className="form-label">
                {col.COLUMN_NAME}
                {col.IS_NULLABLE === "NO" &&
                  !col.EXTRA.includes("auto_increment") && (
                    <span className="required">*</span>
                  )}
                <span className="form-type">({col.DATA_TYPE})</span>
              </label>
              {renderInput(col)}
              {errors[col.COLUMN_NAME] && (
                <span className="form-error">{errors[col.COLUMN_NAME]}</span>
              )}
            </div>
          );
        })}
      </div>
      <div className="form-actions">
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
