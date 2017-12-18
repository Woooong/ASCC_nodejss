var express = require('express');
var crypto = require('crypto');
var yymmdd = require('yyyy-mm-dd');
var router = express.Router();

var mysql      = require('mysql');
var connection = mysql.createConnection({
    host     : '13.125.89.193',
    user     : 'root',
    password : 'rPtjdgurdldnfkagjdnd123',
    database : 'ascc'
});
connection.connect();


/* GET home page. */
router.get('/', function(req, res, next) {
    res.render('index', { title: 'api_controller' });
});

//test
router.get('/getClass', function(req, res) {
    console.log(new Date());
    connection.query('SELECT * from class_info', function (error, results, fields) {
        if (error)
            res.json("error");
        // console.log('The solution is: ', Date.now());
        res.json({"code" : 200, "response" : "success", "data" : results});
    });
});

router.get('/getClassAuth', function(req,res){
    var si_num = req.query.si_num;

    if(si_num == '' || si_num == undefined){
        res.json({"code" : 203, "response" : "empty parmater"});
        return false;
    }

    var result_data;

    UserInfo(req, function(ret_json){
        if(ret_json.code != 200){
            res.json(ret_json);
            return false;
        }
        result_data={"code": 200 ,"user_info" : ret_json.data};
        ClassAuth(ret_json.data, function(ret_json){
            if(ret_json.code != 200){
                res.json(ret_json);
                return false;
            }
            result_data.auth_data = ret_json;
            res.json(result_data);
        });
    });
});

function UserInfo(req, callback){

    connection.query("select * from student_info where si_num='"+req.query.si_num+"'", function(err, res, fields){
        if(err){
            callback({"code" : 202, "response" : "sql_err", "data" : err});
            return err;
        }
       callback({"code" : 200, "response" : "success", "data" : res[0]});
       return res;
    });
}

function ClassAuth(req, callback){
    if(req == undefined){
        callback({"code" : 202, "response" : "empty sql select"});
        return false;
    }

    connection.query('SELECT * from class_info where ci_prof_id="'+req.si_id+'"', function (error, results, fields) {
        if (error){
            callback({"code" : 202, "response" : "msyql_error", "error" : error});
            return false;
        }

        var time = new Date();
        var auth = crypto.createHash('md5').update(time.toTimeString()).digest('hex');
        auth = auth.insert(8,'-');
        auth = auth.insert(13,'-');
        auth = auth.insert(18,'-');
        auth = auth.insert(23,'-');

        if(results == ''){
            callback({"code" : 201, "response" : "empty_Class"});
            return false;
        }else{
            connection.query("insert into attendance_info (ai_ci_code, ai_si_id, ai_auth) values ('"+results[0].ci_code+"', '"+req.si_id+"','"+auth+"')", function (error, ins_results,fileds){
                if (error){
                    callback({"code" : 202, "response" : "msyql_error", "error" : error});
                    return false;
                }
            });
        }
        callback({"code" : 200, "response" : "success", "data" : results, "auth" : auth});
    });
}

//TODO 이메일 인증보내기
router.post('/postAuth', function(req, res) {

    connection.query('SELECT * from class_info', function (error, results, fields) {
        if (error)
            res.json({"code" : 202, "response" : "msyql_error", "error" : error});
        // console.log('The solution is: ', results);
        res.json({"code" : 200, "response" : "success", "data" : results});
    });

});

//TODO 로그인
router.post('/login',function(req,res){
    //validate
    var email = req.body.si_email;
    var pwd = req.body.si_pwd;

    console.log(email);
    console.log(pwd);

   connection.query('select * from student_info where si_email = "'+email+'" and si_pwd = "'+pwd+'"', function(error, results, fields){
       if (error)
           res.json({"code" : 202, "response" : "msyql_error", "error" : error});
       // console.log('The solution is: ', results);
       res.json({"code" : 200, "response" : "success", "data" : results});
   });
});

//TODO 출석인증
router.post('/getAtdChk', function(req, res) {
    //validate
    var si_num = req.body.stdId;
    var ci_code = req.body.ciCode;

    // console.log(ci_code);

    if(si_num == undefined|| ci_code == undefined){
        res.send({"code" : 203, "response" : "empty parmater"});
    }
    // var queryString = "SELECT * FROM attendance_info WHERE ai_ci_code ='"+ ci_code +"' ORDER BY ai_id DESC LIMIT 1";
    // connection.query(queryString, function (error, results) {
    //
    //     var ai_auth =results[0].ai_auth;
    //
    //     if(ai_auth) {
            queryString = "INSERT INTO attendance (ci_code, si_num) VALUES('"+ ci_code +"', '"+ si_num +"')";
            connection.query(queryString, function (error, results) {
                console.log(results);

                if(error)
                    res.send({"code" : 202, "response" : "msyql_error", "error" : error});
                else if(results)
                    res.send({"code" : 200, "response" : "attendace check success", "data" : results});
            });
    //     }
    // });

    return true;
});

//TODO 수업리스트
router.post('/getStuClass', function (req, res) {
    var si_num = req.body.si_num;
    var queryString = 'SELECT a.si_num, a.si_name, c.ci_name, c.ci_room, c.ci_time FROM ascc.student_info AS a left join ascc.ci_si_relation as b ON a.si_id = b.csr_si_id inner join ascc.class_info AS c ON b.csr_ci_id = c.ci_id WHERE a.si_num ='+si_num+';';
    // console.log(si_num);
    connection.query(queryString, function (error, results) {
        // console.log(results);
        if(error)
            res.send({"code" : 202, "response" : "msyql_error", "error" : error});
        else if(results.length > 0)
            res.send({"code" : 200, "response" : "success", "data" : results});
        else if(results)
            res.send({"code" : 200, "response" : "this student has no class", "data" : results});
    });

    return true;
});

//TODO 재실인원
router.get('/getInClass', function (req, res) {
    var time = yymmdd.withTime().toString();
    var lowTime = yymmdd.withTime(new Date(Date.parse(time) - 5000*60)).toString();
    // var time = '2017-12-08 10:50:35';
    // var lowTime = '2017-12-08 10:55:35';
    console.log(time);
    console.log(lowTime);
    var queryString = "SELECT ifnull(count(distinct si_num),0) as count FROM ascc.attendance where created_at between  '"+ lowTime +"' and '"+ time +"';";
    connection.query(queryString, function (error, results) {
        // console.log(results);
        if(error)
            res.send({"code" : 202, "response" : "msyql_error", "error" : error});
        else if(results.length > 0)
            res.send({"code" : 200, "response" : "success", "data" : results});
    });

    return true;
});

module.exports = router;

String.prototype.insert = function (index, string) {
    if (index > 0)
        return this.substring(0, index) + string + this.substring(index, this.length);
    else
        return string + this;
};
