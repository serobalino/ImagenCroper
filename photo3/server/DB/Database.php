<?php

class Database {

    /**
     *  PDO connection instance.
     *
     *  @var \PDO
     */
    protected static $pdo = null;

    protected static $prefix = '';
    protected $query;
    protected $query_type = '';
    protected $table   = '';
    protected $where   = '';
    protected $orderby = '';
    protected $limit   = '';
    protected $columns = array();
    protected $bind    = array();
    protected $data    = array();
    protected $operators = array('=', '!=', '<', '>',
                            '>=','<=', 'in', 'not in');

    /**
     * Create a new instance.
     *
     * @return void
     */
    public function __construct()
    {
        if (!static::$pdo) {
            throw new RuntimeException('Not connected to database.');
        }
    }

    /**
     * Connect.
     *
     * @param  array $config
     * @return void
     */
    public static function connect(array $config)
    {
        extract($config);

        static::$prefix = $prefix;

        $dns = "{$driver}:host={$hostname};dbname={$database}";

        $options = array(
            PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES {$charset} COLLATE {$collation}",
        );

        static::$pdo = new PDO($dns, $username, $password, $options);
    }

    /**
     * Get the PDO instance.
     *
     * @return \PDO
     */
    public static function getPdo()
    {
        return static::$pdo;
    }

    /**
     *  Insert.
     *
     *  @param  array $data
     *  @return $this
     */
    public function insert(array $data)
    {
        $this->query_type = 'insert';

        $this->data = $data;

        return $this->runQuery();
    }

    /**
     * Get last insert ID.
     *
     * @return integer
     */
    public function lastInsertId()
    {
        return self::$pdo->lastInsertId();
    }

    /**
     * Select.
     *
     * @param  string $columns
     * @return $this
     */
    public function select($columns = '*')
    {
        $this->query_type = 'select';

        $this->columns = $columns;

        return $this;
    }

    /**
     *  Get select results.
     *
     *  @param  int $fetchMode
     *  @return array|null
     */
    public function get($fetchMode = null)
    {
        if (is_null($fetchMode)) {
            $fetchMode = PDO::FETCH_OBJ;
        }

        if ($this->query_type != 'select') {
            $this->query_type = 'select';
            $this->columns = '*';
        }

        if ($this->runQuery()) {
            return $this->query->fetchAll($fetchMode);
        }

        return null;
    }

    /**
     * Update.
     *
     * @param  array $data
     * @return $this
     */
    public function update(array $data)
    {
        $this->query_type = 'update';

        $this->data = $data;

        return $this->runQuery();
    }

    /**
     * Delete.
     *
     * @return bool
     */
    public function delete()
    {
        $this->query_type = 'delete';

        return $this->runQuery();
    }

    /**
     * Set table.
     *
     * @param  $table string
     * @return $this
     */
    public function table($table)
    {
        $this->table = $table;

        return $this;
    }

    /**
     * Where (AND).
     *
     * @param  string $column
     * @param  string $value
     * @param  string $operator
     * @param  string $boolean
     * @return $this
     */
    public function where($column, $value, $operator = '=', $boolean = 'AND')
    {
        $operator = strtolower($operator);

        if (!in_array($operator, $this->operators)) {
            $operator = '=';
        }

        if (!empty($this->where)) {
            if (in_array(strtolower($boolean), array('and', 'or'))) {
                $this->where .= " $boolean ";
            } else {
                $this->where .= ' AND ';
            }
        }

        $this->where .= " $column $operator";

        if ($operator == 'in' || $operator == 'not in') {
            $values = implode(',', array_fill(0, count($value), '?'));
            $this->where .= ' ('.$values.') ';
        } else {
            $this->where .= ' ? ';
        }

        if (is_array($value)) {
            foreach ($value as $val) {
                $this->bind[] = $val;
            }
        } else {
            $this->bind[] = $value;
        }

        return $this;
    }

    /**
     * Where (OR).
     *
     * @param  string $column
     * @param  string $value
     * @param  string $operator
     * @param  string $boolean
     * @return $this
     */
    public function orWhere($column, $value, $operator = '=')
    {
        return $this->where($column, $value, $operator, 'OR');
    }

    /**
     * Where (IN).
     *
     * @param  string $column
     * @param  array  $values
     * @return $this
     */
    public function whereIn($column, $values)
    {
        return $this->where($column, $values, 'IN');
    }

    /**
     * Where (NOT IN).
     *
     * @param  string $column
     * @param  array  $values
     * @return $this
     */
    public function whereNotIn($column, $values)
    {
        return $this->where($column, $values, 'NOT IN');
    }

    /**
     *  Order By.
     *
     *  @param  string $columns
     *  @param  string $order
     *  @return $this
     */
    public function orderBy($columns, $order = 'ASC')
    {
        if (!is_array($columns)) {
            $columns = array($columns);
        }

        foreach($columns as $column) {
            $column = $column . ' ' . $order;

            if (!empty($this->orderby)){
                $this->orderby .= ', ' . $column;
            } else {
                $this->orderby = $column;
            }
        }

        return $this;
    }

    /**
     * Limit.
     *
     * @param  integer $limit
     * @param  integer|null $range
     * @return $this
     */
    public function limit($limit, $range = null)
    {
        if ( is_numeric($limit) ) {
            $this->limit = $limit;

            if ( !empty($range) && is_numeric($range) ) {
                $this->limit .= ", $range";
            }
        }

        return $this;
    }

    /**
     *  Reset.
     *
     *  @return void
     */
    protected function reset()
    {
        $this->query_type = '';
        $this->table   = '';
        $this->where   = '';
        $this->orderby = '';
        $this->limit   = '';
        $this->columns = array();
        $this->bind    = array();
        $this->data    = array();
    }

     /**
     *  Build & run query.
     *
     *  @return bool
     */
    protected function runQuery()
    {
        $sql_query = '';

        $table = static::$prefix . $this->table;

        switch ($this->query_type) {
            case 'insert':
                if (!count($this->data)) {
                    return false;
                }

                foreach ($this->data as $key => $value) {
                    $this->columns[] = $key;
                    $this->bind[] = $value;
                }

                $values  = implode(',', array_fill(0, count($this->columns), '?'));
                $columns = implode(',', $this->columns);
                $sql_query .= 'INSERT INTO '.$table.' ('.$columns.') VALUES('.$values.')';
                break;

            case 'select':
                if (is_array($this->columns)) {
                    $this->columns = implode(',', $this->columns);
                }
                $sql_query .= 'SELECT '.$this->columns.' FROM '.$table;
                break;

            case 'update':
                $bind = $this->bind;
                $this->bind = array();

                $sql_query .= 'UPDATE '.$table.' SET ';
                if (count($this->data)) {
                    foreach ($this->data as $key => $value) {
                        $sql_query .= $key.'=?,';
                        $this->bind[] = $value;
                    }
                    $sql_query = substr($sql_query, 0, strlen($sql_query) - 1);
                }

                if (count($bind)) {
                    foreach ($bind as $value) {
                        $this->bind[] = $value;
                    }
                }
                break;

            case 'delete':
                $sql_query .= 'DELETE FROM '.$table;
                break;
        }

        if (!empty($this->where)) {
            $sql_query .= ' WHERE '.$this->where;
        }

        if (!empty($this->orderby)) {
            $sql_query .= ' ORDER BY '.$this->orderby;
        }

        if (!empty($this->limit)) {
            $sql_query .= ' LIMIT '.$this->limit;
        }

        $bind = $this->bind;
        $this->reset();

        if ( $this->query = self::$pdo->prepare($sql_query) ) {
            if (count($bind)) {
                $k = 1;
                foreach ($bind as $value) {
                    $this->query->bindValue($k, $value);
                    $k ++;
                }
            }

            if ($this->query->execute()) {
                return true;
            }

        }

        return false;
    }
}
